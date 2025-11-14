import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { loadChatPromptTemplate, saveChatPromptTemplate, chatDefaultPrompt } from '../ai/chatPrompt';

const AIRefactorPanel = ({ onRefactor, isRefactoring, currentCode, onChatMessage, isChatting, chatMessages }) => {
  const [instructions, setInstructions] = useState('');
  const [refactorHistory, setRefactorHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [refactorOpen, setRefactorOpen] = useState(true);
  const [isChatPromptOpen, setIsChatPromptOpen] = useState(false);
  const [chatPromptText, setChatPromptText] = useState('');

  const handleRefactor = () => {
    if (!instructions?.trim()) return;
    
    const refactorRequest = {
      instructions: instructions,
      currentCode: currentCode,
      timestamp: new Date()?.toISOString()
    };
    
    setRefactorHistory(prev => [refactorRequest, ...prev?.slice(0, 4)]);
    onRefactor(instructions);
    setInstructions('');
  };

  const handleChatSend = () => {
    if (!chatInput?.trim()) return;
    onChatMessage?.(chatInput);
    setChatInput('');
  };

  const openChatPromptEditor = () => {
    setChatPromptText(loadChatPromptTemplate());
    setIsChatPromptOpen(true);
  };

  const saveChatPromptEditor = () => {
    saveChatPromptTemplate(chatPromptText || chatDefaultPrompt);
    setIsChatPromptOpen(false);
  };

  const resetChatPromptEditor = () => {
    setChatPromptText(chatDefaultPrompt);
  };

  const useHistoryItem = (item) => {
    setInstructions(item?.instructions);
  };

  const escapeHtml = (s) => s?.replace(/&/g, '&amp;')?.replace(/</g, '&lt;')?.replace(/>/g, '&gt;') ?? '';
  const jsHighlight = (code) => {
    let out = escapeHtml(code);
    out = out.replace(/\/\/[^\n]*/g, (m) => `<span class="text-success">${m}</span>`);
    out = out.replace(/\/\*[^]*?\*\//g, (m) => `<span class="text-success">${m}</span>`);
    out = out.replace(/("[^"]*"|'[^']*')/g, (m) => `<span class="text-pink-600">${m}</span>`);
    const keywords = ['const','let','var','function','return','if','else','for','while','switch','case','break','continue','try','catch','finally','class','new','this','import','from','export','default','async','await'];
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    out = out.replace(kwRegex, (m) => `<span class="text-indigo-600 font-medium">${m}</span>`);
    return out;
  };

  const MessageRenderer = ({ text, role }) => {
    const elements = useMemo(() => {
      const lines = (text || '').split(/\r?\n/);
      const out = [];
      let inCode = false;
      let codeLang = '';
      let codeBuf = [];
      let listBuf = null;
      let listType = null;
      const headings = [];
      const pushParagraph = (t) => {
        let h = escapeHtml(t);
        h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        out.push({ type: 'html', html: h });
      };
      const flushList = () => {
        if (!listBuf) return;
        out.push({ type: listType, items: listBuf });
        listBuf = null;
        listType = null;
      };
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const codeFence = line.match(/^```(\w+)?\s*$/);
        if (codeFence) {
          if (!inCode) {
            flushList();
            inCode = true;
            codeLang = codeFence[1] || '';
            codeBuf = [];
          } else {
            const code = codeBuf.join('\n');
            const highlighted = codeLang === 'js' || codeLang === 'javascript' || codeLang === 'ts' ? jsHighlight(code) : escapeHtml(code);
            out.push({ type: 'code', html: highlighted });
            inCode = false;
            codeLang = '';
            codeBuf = [];
          }
          continue;
        }
        if (inCode) {
          codeBuf.push(line);
          continue;
        }
        if (/^---\s*$/.test(line)) {
          flushList();
          out.push({ type: 'hr' });
          continue;
        }
        const hMatch = line.match(/^#{1,6}\s+(.*)$/);
        if (hMatch) {
          flushList();
          const t = hMatch[1].trim();
          const id = t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          headings.push({ id, text: t });
          out.push({ type: 'heading', text: t, id });
          continue;
        }
        const callout = line.match(/^(Note|Warning|Tip|Error):\s*(.*)$/i);
        if (callout) {
          flushList();
          out.push({ type: 'callout', kind: callout[1].toLowerCase(), text: callout[2] });
          continue;
        }
        const ol = line.match(/^\s*\d+\.\s+(.*)$/);
        if (ol) {
          if (!listBuf || listType !== 'ol') { flushList(); listBuf = []; listType = 'ol'; }
          listBuf.push(ol[1]);
          continue;
        }
        const ul = line.match(/^\s*[-*]\s+(.*)$/);
        if (ul) {
          if (!listBuf || listType !== 'ul') { flushList(); listBuf = []; listType = 'ul'; }
          listBuf.push(ul[1]);
          continue;
        }
        if (!line.trim()) { flushList(); out.push({ type: 'spacer' }); continue; }
        flushList();
        pushParagraph(line);
      }
      flushList();
      if (headings.length >= 3) {
        out.unshift({ type: 'nav', items: headings });
      }
      return out;
    }, [text]);

    return (
      <div className={`text-xs ${role === 'user' ? 'text-text-primary' : 'text-text-secondary'}`}>
        <div className="space-y-2">
          {elements.map((el, idx) => {
            if (el.type === 'nav') {
              return (
                <div key={idx} className="border border-border rounded p-2 bg-muted/40">
                  <div className="text-[11px] font-medium text-text-secondary mb-1">Navigation</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {el.items.map((h, i) => (
                      <li key={i}><a href={`#${h.id}`} className="text-text-primary hover:underline">{h.text}</a></li>
                    ))}
                  </ul>
                </div>
              );
            }
            if (el.type === 'heading') {
              return <div key={idx} id={el.id} className="text-sm font-semibold text-text-primary mt-2">{el.text}</div>;
            }
            if (el.type === 'ul') {
              return (
                <ul key={idx} className="list-disc pl-5 space-y-1">
                  {el.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: escapeHtml(it).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>') }} />)}
                </ul>
              );
            }
            if (el.type === 'ol') {
              return (
                <ol key={idx} className="list-decimal pl-5 space-y-1">
                  {el.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: escapeHtml(it).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>') }} />)}
                </ol>
              );
            }
            if (el.type === 'code') {
              return (
                <div key={idx} className="overflow-auto border border-border rounded bg-slate-900">
                  <pre className="p-2 text-slate-100 text-[11px] font-mono" dangerouslySetInnerHTML={{ __html: el.html }} />
                </div>
              );
            }
            if (el.type === 'hr') {
              return <div key={idx} className="border-t border-border my-2" />;
            }
            if (el.type === 'callout') {
              const map = {
                note: { icon: 'Info', bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent' },
                warning: { icon: 'AlertTriangle', bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning' },
                tip: { icon: 'Lightbulb', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
                error: { icon: 'AlertTriangle', bg: 'bg-error/10', border: 'border-error/20', text: 'text-error' }
              };
              const cfg = map[el.kind] || map.note;
              return (
                <div key={idx} className={`border rounded p-2 text-xs ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-start space-x-2">
                    <Icon name={cfg.icon} size={12} className={cfg.text} />
                    <div className="flex-1" dangerouslySetInnerHTML={{ __html: escapeHtml(el.text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>') }} />
                  </div>
                </div>
              );
            }
            if (el.type === 'spacer') {
              return <div key={idx} className="h-2" />;
            }
            if (el.type === 'html') {
              return <div key={idx} dangerouslySetInnerHTML={{ __html: el.html }} />;
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="MessageSquare" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">AI Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="xs" iconName="Settings" onClick={openChatPromptEditor}>Edit Chat Prompt</Button>
          <Button variant="outline" size="xs" iconName={chatOpen ? 'ChevronUp' : 'ChevronDown'} onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? 'Hide' : 'Show'}</Button>
        </div>
      </div>
      <div className={`${chatOpen ? 'opacity-100 max-h-[480px]' : 'opacity-0 max-h-0'} transition-all duration-200 overflow-hidden space-y-2`}>
        <div className="border border-border rounded p-2 max-h-40 overflow-y-auto bg-popover">
          {chatMessages?.length === 0 ? null : (
            chatMessages?.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[11px] font-medium text-text-secondary">{m.role === 'user' ? 'You' : 'AI'}</div>
                <MessageRenderer text={m.content} role={m.role} />
                <div className="border-t border-border opacity-50" />
              </div>
            ))
          )}
        </div>
        <div className="flex items-start space-x-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e?.target?.value)}
            placeholder="Ask about the current snippet..."
            className="flex-1 h-24 px-3 py-2 border border-border rounded text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isChatting}
            rows={3}
          />
          <Button variant="default" size="sm" iconName="MessageSquare" onClick={handleChatSend} disabled={isChatting || !chatInput?.trim()} loading={isChatting}>Send</Button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2">
          <Icon name="Sparkles" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">AI Code Refactor</h3>
        </div>
        <Button variant="outline" size="xs" iconName={refactorOpen ? 'ChevronUp' : 'ChevronDown'} onClick={() => setRefactorOpen(!refactorOpen)}>{refactorOpen ? 'Hide' : 'Show'}</Button>
      </div>
      <div className={`${refactorOpen ? 'opacity-100 max-h-[640px]' : 'opacity-0 max-h-0'} transition-all duration-200 overflow-hidden space-y-3`}>
        <div className="relative">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e?.target?.value)}
            placeholder="Describe how you want to modify the JavaScript code..."
            className="w-full h-24 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={isRefactoring}
          />
          <div className="absolute bottom-2 right-2 text-xs text-text-secondary">
            {instructions?.length}/500
          </div>
        </div>
        <Button
          variant="default"
          iconName="Wand2"
          iconPosition="left"
          onClick={handleRefactor}
          disabled={!instructions?.trim() || isRefactoring}
          loading={isRefactoring}
          fullWidth
        >
          Generate Refactored Code
        </Button>
      </div>

      {isChatPromptOpen && (
        <div className="fixed inset-0 z-70 bg-black/30 flex items-center justify-center">
          <div className="bg-popover border border-border rounded-lg w-[640px] max-w-[95vw]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="Settings" size={16} />
                <span className="text-sm font-medium text-text-primary">AI Chat Prompt</span>
              </div>
              <Button variant="ghost" size="sm" iconName="X" onClick={() => setIsChatPromptOpen(false)} />
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={chatPromptText}
                onChange={(e) => setChatPromptText(e?.target?.value)}
                className="w-full h-48 p-3 border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Enter chat prompt template using placeholders"
              />
              <div className="text-xs text-text-secondary">
                Placeholders: {'{{message}}'}, {'{{code}}'}, {'{{fileName}}'}, {'{{fileContentExcerpt}}'}, {'{{diffItemsList}}'}, {'{{metadataJson}}'}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={resetChatPromptEditor}>Reset</Button>
              <Button variant="default" size="sm" onClick={saveChatPromptEditor}>Save</Button>
            </div>
          </div>
        </div>
      )}
      {refactorHistory?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Recent Requests</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {refactorHistory?.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-card border border-border rounded text-xs"
              >
                <span className="flex-1 truncate text-text-secondary">
                  {item?.instructions}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="RotateCcw"
                  onClick={() => useHistoryItem(item)}
                  disabled={isRefactoring}
                  className="ml-2 text-text-secondary hover:text-text-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={16} className="text-accent mt-0.5" />
          <div className="text-xs text-accent space-y-1">
            <p><strong>AI Chat:</strong> Discuss the code, ask questions, and clarify goals.</p>
            <p><strong>AI Refactor:</strong> Then describe modifications in natural language.</p>
            <p>Examples: "Add error handling", "Optimize performance", "Add documentation"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRefactorPanel;
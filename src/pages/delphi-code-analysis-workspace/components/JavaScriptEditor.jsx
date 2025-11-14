import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { snippetsCatalog } from '../snippets';
import getProcedureFunctionCode from '../snippets/GetProcedureFunctionCode.js?raw';
import { defaultPrompt, loadPromptTemplate, savePromptTemplate } from '../ai/prompt';

const JavaScriptEditor = ({ code, onCodeChange, onExecute, isProcessing, executionStatus }) => {
  const [editorCode, setEditorCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const defaultCode = getProcedureFunctionCode;

  useEffect(() => {
    if (code) {
      setEditorCode(code);
    } else {
      setEditorCode(defaultCode);
      onCodeChange(defaultCode);
    }
  }, [code, defaultCode]);

  const openPromptEditor = () => {
    setPromptText(loadPromptTemplate());
    setIsPromptOpen(true);
  };

  const savePromptEditor = () => {
    savePromptTemplate(promptText || defaultPrompt);
    setIsPromptOpen(false);
  };

  const resetPromptEditor = () => {
    setPromptText(defaultPrompt);
  };

  const handleCodeChange = (e) => {
    const newCode = e?.target?.value;
    setEditorCode(newCode);
    onCodeChange(newCode);
  };

  const getSelectedSnippet = () => snippetsCatalog.find(s => s.id === selectedSnippetId);

  const applySnippet = (mode) => {
    const snippet = getSelectedSnippet();
    if (!snippet || !snippet.code) return;
    if (mode === 'replace') {
      setEditorCode(snippet.code);
      onCodeChange(snippet.code);
      return;
    }
    if (mode === 'append') {
      const next = editorCode ? editorCode + '\n\n' + snippet.code : snippet.code;
      setEditorCode(next);
      onCodeChange(next);
      return;
    }
    if (mode === 'insert') {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? editorCode.length;
      const end = el.selectionEnd ?? editorCode.length;
      const next = editorCode.slice(0, start) + snippet.code + editorCode.slice(end);
      setEditorCode(next);
      onCodeChange(next);
      return;
    }
  };

  const handleExecute = () => {
    onExecute(editorCode);
  };

  const handleKeyDown = (e) => {
    if (e?.key === 'F5') {
      e?.preventDefault();
      handleExecute();
    }
    if (e?.ctrlKey && e?.key === 's') {
      e?.preventDefault();
      // Save functionality could be implemented here
    }
  };

  const getStatusColor = () => {
    switch (executionStatus) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'running': return 'text-warning';
      default: return 'text-text-secondary';
    }
  };

  const getStatusIcon = () => {
    switch (executionStatus) {
      case 'success': return 'CheckCircle';
      case 'error': return 'XCircle';
      case 'running': return 'Loader';
      default: return 'Code';
    }
  };

  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const removeTargetButton = () => {
      const buttons = root.querySelectorAll('button');
      let target = null;
      for (const b of buttons) {
        const text = (b.textContent || '').trim();
        if (text === 'Execute Script') { target = b; break; }
      }
      if (!target) return;
      try {
        target.replaceChildren();
        for (const k in target.dataset) { try { delete target.dataset[k]; } catch {} }
        const parent = target.parentNode;
        if (parent) parent.removeChild(target);
      } catch {}
    };
    removeTargetButton();
    const obs = new MutationObserver(() => removeTargetButton());
    try { obs.observe(root, { childList: true, subtree: true }); } catch {}
    return () => { try { obs.disconnect(); } catch {} };
  }, []);

  return (
    <div ref={rootRef} className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-text-primary">JavaScript Editor</h3>
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon()} 
              size={16} 
              className={`${getStatusColor()} ${executionStatus === 'running' ? 'animate-spin' : ''}`} 
            />
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {executionStatus === 'running' ? 'Processing...' : 
               executionStatus === 'success' ? 'Ready' :
               executionStatus === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            iconName={isFullscreen ? 'Minimize2' : 'Maximize2'}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-text-secondary hover:text-text-primary"
          />
          <Button
            variant="outline"
            size="sm"
            iconName="RotateCcw"
            onClick={() => {
              setEditorCode(defaultCode);
              onCodeChange(defaultCode);
            }}
            disabled={isProcessing}
            className="text-xs"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Settings"
            onClick={openPromptEditor}
            disabled={isProcessing}
            className="text-xs"
          >
            Edit AI Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Library"
            onClick={() => setIsLibraryOpen(true)}
            disabled={isProcessing}
            className="text-xs"
          >
            JavaScript Library
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Wand2"
            onClick={() => { try { window.dispatchEvent(new Event('open-refactor-modal')); } catch {} }}
            disabled={isProcessing}
            className="text-xs"
            aria-label="Open AI Code Refactor"
          >
            Refactor
          </Button>
        </div>
      </div>

      {isPromptOpen && (
        <div className="fixed inset-0 z-70 bg-black/30 flex items-center justify-center">
          <div className="bg-popover border border-border rounded-lg w-[640px] max-w-[95vw]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="Settings" size={16} />
                <span className="text-sm font-medium text-text-primary">AI Refactor Prompt</span>
              </div>
              <Button variant="ghost" size="sm" iconName="X" onClick={() => setIsPromptOpen(false)} />
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e?.target?.value)}
                className="w-full h-48 p-3 border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Enter prompt template using {{instructions}} and {{code}} placeholders"
              />
              <div className="text-xs text-text-secondary">Placeholders: {'{{instructions}}'}, {'{{code}}'}</div>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={resetPromptEditor}>Reset</Button>
              <Button variant="default" size="sm" onClick={savePromptEditor}>Save</Button>
            </div>
          </div>
        </div>
      )}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-70 bg-black/30 flex items-center justify-center">
          <div className="bg-popover border border-border rounded-lg w-[720px] max-w-[95vw]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="Library" size={16} />
                <span className="text-sm font-medium text-text-primary">JavaScript Library</span>
              </div>
              <Button variant="ghost" size="sm" iconName="X" onClick={() => setIsLibraryOpen(false)} />
            </div>
            <div className="p-4 space-y-3">
              <Select
                options={snippetsCatalog.map(s => ({ label: s.title, value: s.id, description: s.description }))}
                value={selectedSnippetId}
                onChange={setSelectedSnippetId}
                placeholder="Choose a snippet"
                searchable
                clearable
              />
              {getSelectedSnippet() && (
                <div>
                  <div className="text-xs text-text-secondary mb-2">Lines: {getSelectedSnippet().code.split('\n').length}</div>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto max-h-56">{getSelectedSnippet().code}</pre>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-end space-x-2">
              <Button variant="outline" size="xs" onClick={() => applySnippet('insert')} disabled={isProcessing || !selectedSnippetId}>Insert</Button>
              <Button variant="outline" size="xs" onClick={() => applySnippet('replace')} disabled={isProcessing || !selectedSnippetId}>Replace</Button>
              <Button variant="outline" size="xs" onClick={() => applySnippet('append')} disabled={isProcessing || !selectedSnippetId}>Append</Button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-slate-900 px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Code2" size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-300">analysis.js</span>
            </div>
            <div className="text-xs text-slate-400">
              F5: Execute • Ctrl+S: Save
            </div>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            value={editorCode}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            ref={textareaRef}
            className="w-full h-96 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            placeholder="Enter your JavaScript code here..."
            spellCheck={false}
          />
          
          <div className="absolute bottom-2 right-2 text-xs text-slate-500">
            Lines: {editorCode?.split('\n')?.length}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end"></div>
    </div>
  );
};

export default JavaScriptEditor;
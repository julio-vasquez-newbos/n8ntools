import React, { useState, useCallback } from 'react';
import { loadPromptTemplate } from './ai/prompt';
import { chatSystemPrompt, loadChatPromptTemplate } from './ai/chatPrompt';
import ApplicationHeader from '../../components/ui/ApplicationHeader';
import FileUploadPanel from './components/FileUploadPanel';
import DiffLineItemsTable from './components/DiffLineItemsTable';
import MetadataPanel from './components/MetadataPanel';
import JavaScriptEditor from './components/JavaScriptEditor';
import AIRefactorPanel from './components/AIRefactorPanel';
import ResultsTable from './components/ResultsTable';
import CodeViewer from './components/CodeViewer';
import JSONOutputPanel from './components/JSONOutputPanel';
import ErrorDisplay from './components/ErrorDisplay';
import Button from '../../components/ui/Button';


const DelphiCodeAnalysisWorkspace = () => {
  // State management
  const [uploadedFile, setUploadedFile] = useState(null);
  const [diffItems, setDiffItems] = useState([]);
  const [metadata, setMetadata] = useState({ revision: '', path: '' });
  const [jsCode, setJsCode] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [executionStatus, setExecutionStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [selectedCodeData, setSelectedCodeData] = useState(null);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isJSONVisible, setIsJSONVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  const executeJavaScript = useCallback(async (code, fileContent, diffItems, metadata) => {
    function b64ToUtf8(b64) {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    }
    function utf8ToB64(str) {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    }
    function createDollar(fc, fn, di, md) {
      return q => {
        if (q === 'Read .PAS Files from Disk') {
          return { first: () => ({ binary: { data: { data: utf8ToB64(fc || '') } }, json: { fileName: fn || 'uploaded.pas' } }) };
        }
        if (q === 'Return Array of Line Numbers+Rows per Diff File') {
          return { first: () => ({ json: { newLineNumbersOnly: di || [] } }) };
        }
        if (q === 'Read Diff File') {
          return { first: () => ({ json: { revision: md?.revision, path: md?.path } }) };
        }
        return { first: () => ({}) };
      };
    }
    const dollar = createDollar(fileContent, uploadedFile?.name, diffItems, metadata);
    const BufferPoly = { from: (b64, enc) => ({ toString: e => b64ToUtf8(b64) }) };
    try {
      const factory = new Function('fileContent', 'diffItems', 'metadata', '$', 'Buffer', '"use strict"; return (function(){' + code + '\n})();');
      const out = factory(fileContent, diffItems, metadata, dollar, BufferPoly);
      let results;
      if (typeof out === 'function') {
        results = await Promise.resolve(out(fileContent, diffItems, metadata));
      } else {
        results = out;
      }
      if (!Array.isArray(results)) {
        throw new Error('Script must return an array of results');
      }
      if (results?.[0]?.json) {
        results = results.map(r => ({
          procedure: r.json?.procedure,
          lineNumber: r.json?.lineNumber,
          affectedRows: r.json?.affectedRows,
          revision: r.json?.revision,
          path: r.json?.path,
          code: r.json?.procedureCode,
          actualStartLine: r.json?.lineNumber || 0,
          actualEndLine: (r.json?.lineNumber || 0) + (r.json?.affectedRows || 0)
        }));
      }
      return results;
    } catch (err) {
      throw new Error(`JavaScript execution failed: ${err.message}`);
    }
  }, [uploadedFile]);

  // Mock AI refactor function
  const performAIRefactor = useCallback(async (instructions) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey) throw new Error('OpenAI API key not configured');
    const tpl = loadPromptTemplate();
    const system = 'You are a code refactoring assistant. Return only executable JavaScript without markdown.';
    let user = tpl;
    user = user.replace('{{instructions}}', instructions || '').replace('{{code}}', jsCode || '');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || 'OpenAI request failed');
    let content = data?.choices?.[0]?.message?.content || '';
    content = content.replace(/^```[a-zA-Z]*\n/, '').replace(/```\s*$/, '');
    return content;
  }, [jsCode]);

  const performAIChat = useCallback(async (userMessage, history, code, fileCtx, diffCtx, metaCtx) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey) throw new Error('OpenAI API key not configured');
    const messages = [{ role: 'system', content: chatSystemPrompt }];
    const tpl = loadChatPromptTemplate();
    const userContent = tpl
      .replace('{{message}}', userMessage || '')
      .replace('{{code}}', code || '')
      .replace('{{fileName}}', fileCtx?.name || '')
      .replace('{{fileContentExcerpt}}', fileCtx?.excerpt || '')
      .replace('{{diffItemsList}}', diffCtx?.list || '')
      .replace('{{metadataJson}}', metaCtx?.json || '');
    history?.forEach(m => messages.push({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: userContent });
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.2 })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || 'OpenAI request failed');
    return data?.choices?.[0]?.message?.content || '';
  }, []);

  // Event handlers
  const handleFileUpload = useCallback((file) => {
    setUploadedFile(file);
    setAnalysisResults([]);
    setError(null);
  }, []);

  const handleDiffItemsChange = useCallback((items) => {
    setDiffItems(items);
  }, []);

  const handleMetadataChange = useCallback((newMetadata) => {
    setMetadata(newMetadata);
  }, []);

  const handleCodeChange = useCallback((code) => {
    setJsCode(code);
  }, []);

  const handleExecuteScript = useCallback(async (code) => {
    if (!uploadedFile) {
      setError(new Error('Please upload a .pas file first'));
      return;
    }

    const validDiffItems = diffItems?.filter(item => 
      item?.newLineNumber && item?.affectedRows && 
      parseInt(item?.newLineNumber) > 0 && parseInt(item?.affectedRows) > 0
    );

    if (validDiffItems?.length === 0) {
      setError(new Error('Please add at least one valid diff line item'));
      return;
    }

    setIsProcessing(true);
    setExecutionStatus('running');
    setError(null);

    try {
      const results = await executeJavaScript(code, uploadedFile?.content, validDiffItems, metadata);
      setAnalysisResults(results);
      setExecutionStatus('success');
    } catch (err) {
      setError(err);
      setExecutionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, diffItems, metadata, executeJavaScript]);

  const handleAIRefactor = useCallback(async (instructions) => {
    setIsRefactoring(true);
    try {
      const refactoredCode = await performAIRefactor(instructions);
      setJsCode(refactoredCode);
    } catch (err) {
      setError(new Error(`AI refactor failed: ${err.message}`));
    } finally {
      setIsRefactoring(false);
    }
  }, [performAIRefactor]);

  const handleAIChatMessage = useCallback(async (message) => {
    setIsChatting(true);
    try {
      const nextHistory = [...chatMessages, { role: 'user', content: message }];
      const fileExcerpt = (uploadedFile?.content || '').slice(0, 4000);
      const diffList = (diffItems || [])
        .map(d => `- line ${d?.newLineNumber}, rows ${d?.affectedRows}`)
        .join('\n');
      const reply = await performAIChat(
        message,
        chatMessages,
        jsCode,
        { name: uploadedFile?.name || '', excerpt: fileExcerpt },
        { list: diffList },
        { json: JSON.stringify(metadata || {}) }
      );
      const updated = [...nextHistory, { role: 'assistant', content: reply }];
      setChatMessages(updated);
    } catch (err) {
      setError(new Error(`AI chat failed: ${err.message}`));
    } finally {
      setIsChatting(false);
    }
  }, [chatMessages, performAIChat, jsCode, uploadedFile, diffItems, metadata]);

  const handleViewCode = useCallback((codeData) => {
    setSelectedCodeData(codeData);
    setIsCodeViewerOpen(true);
  }, []);

  const handleCloseCodeViewer = useCallback(() => {
    setIsCodeViewerOpen(false);
    setSelectedCodeData(null);
  }, []);

  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRunAnalysis = useCallback(() => {
    handleExecuteScript(jsCode);
  }, [handleExecuteScript, jsCode]);

  const canExecute = uploadedFile && diffItems?.some(item => 
    item?.newLineNumber && item?.affectedRows && 
    parseInt(item?.newLineNumber) > 0 && parseInt(item?.affectedRows) > 0
  ) && jsCode?.trim();

  return (
    <div className="min-h-screen bg-background">
      <ApplicationHeader 
        userRole="developer"
        sessionStatus="active"
        onSaveScript={() => console.log('Save script')}
        onExport={() => console.log('Export results')}
        onHelp={() => console.log('Show help')}
      />
      <div className="pt-18">
        <div className="flex h-[calc(100vh-72px)]">
          {/* Input Panel - 25% */}
          <div className="w-1/4 border-r border-border bg-surface overflow-y-auto">
            <div className="p-6 space-y-6">
              <FileUploadPanel
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
              />
              
              <DiffLineItemsTable
                diffItems={diffItems}
                onDiffItemsChange={handleDiffItemsChange}
                isProcessing={isProcessing}
              />
              
              <MetadataPanel
                metadata={metadata}
                onMetadataChange={handleMetadataChange}
                isProcessing={isProcessing}
              />
              
              <div className="pt-4 border-t border-border">
                <Button
                  variant="default"
                  size="lg"
                  iconName="Play"
                  iconPosition="left"
                  onClick={handleRunAnalysis}
                  disabled={!canExecute || isProcessing}
                  loading={isProcessing}
                  fullWidth
                >
                  Run Analysis
                </Button>
                
                {!canExecute && (
                  <div className="mt-2 text-xs text-text-secondary">
                    {!uploadedFile && '• Upload a .pas file'}
                    {uploadedFile && !diffItems?.some(item => item?.newLineNumber && item?.affectedRows) && '• Add valid line items'}
                    {uploadedFile && diffItems?.some(item => item?.newLineNumber && item?.affectedRows) && !jsCode?.trim() && '• Enter JavaScript code'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Process Panel - 35% */}
          <div className="w-[35%] border-r border-border bg-surface overflow-y-auto">
            <div className="p-6 space-y-6">
              <JavaScriptEditor
                code={jsCode}
                onCodeChange={handleCodeChange}
                onExecute={handleExecuteScript}
                isProcessing={isProcessing}
                executionStatus={executionStatus}
              />
              
              <AIRefactorPanel
                onRefactor={handleAIRefactor}
                isRefactoring={isRefactoring}
                currentCode={jsCode}
                onChatMessage={handleAIChatMessage}
                isChatting={isChatting}
                chatMessages={chatMessages}
              />
            </div>
          </div>

          {/* Output Panel - 40% */}
          <div className="w-[40%] bg-surface overflow-y-auto">
            <div className="p-6 space-y-6">
              {error && (
                <ErrorDisplay
                  error={error}
                  onClear={handleClearError}
                />
              )}
              
              <ResultsTable
                results={analysisResults}
                onViewCode={handleViewCode}
                isLoading={isProcessing}
              />
              
              <JSONOutputPanel
                results={analysisResults}
                isVisible={isJSONVisible}
                onToggle={() => setIsJSONVisible(!isJSONVisible)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Code Viewer Modal */}
      <CodeViewer
        isOpen={isCodeViewerOpen}
        onClose={handleCloseCodeViewer}
        codeData={selectedCodeData}
      />
    </div>
  );
};

export default DelphiCodeAnalysisWorkspace;
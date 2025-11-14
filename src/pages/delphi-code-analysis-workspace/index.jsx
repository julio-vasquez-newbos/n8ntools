import React, { useState, useCallback } from 'react';
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

  const executeJavaScript = useCallback(async (code, fileContent, diffItems, metadata) => {
    try {
      const factory = new Function('"use strict"; return (function(){' + code + '\n})();');
      const analyzeFn = factory();
      if (typeof analyzeFn !== 'function') {
        throw new Error('Script must return a function');
      }
      const results = await Promise.resolve(analyzeFn(fileContent, diffItems, metadata));
      if (!Array.isArray(results)) {
        throw new Error('Script must return an array of results');
      }
      return results;
    } catch (err) {
      throw new Error(`JavaScript execution failed: ${err.message}`);
    }
  }, []);

  // Mock AI refactor function
  const performAIRefactor = useCallback(async (instructions) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const refactoredCode = `// AI Refactored Code based on: "${instructions}"\n${jsCode}\n\n// Additional improvements added by AI`;
        resolve(refactoredCode);
      }, 3000);
    });
  }, [jsCode]);

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
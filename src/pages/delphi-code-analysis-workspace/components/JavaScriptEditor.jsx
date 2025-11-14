import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JavaScriptEditor = ({ code, onCodeChange, onExecute, isProcessing, executionStatus }) => {
  const [editorCode, setEditorCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const defaultCode = `// Delphi Code Analysis Script
// This script processes uploaded .pas files and extracts procedure/function information

function analyzeDelphiCode(fileContent, diffItems, metadata) {
  const lines = fileContent.split('\\n');
  const results = [];
  
  // Regex patterns for Delphi procedures and functions
  const procedureRegex = /^\\s*(procedure|function|constructor|destructor)\\s+([\\w\\.]+)/i;
  const classMethodRegex = /^\\s*(class\\s+)?(procedure|function|constructor|destructor)\\s+([\\w\\.]+)/i;
  
  diffItems.forEach(item => {
    const lineNumber = parseInt(item.newLineNumber);
    const affectedRows = parseInt(item.affectedRows) || 5;
    
    if (lineNumber > 0 && lineNumber <= lines.length) {
      // Extract code around the specified line
      const startLine = Math.max(0, lineNumber - Math.floor(affectedRows / 2) - 1);
      const endLine = Math.min(lines.length, lineNumber + Math.floor(affectedRows / 2));
      
      const codeSlice = lines.slice(startLine, endLine);
      const procedureInfo = findProcedureInSlice(codeSlice, startLine + 1);
      
      if (procedureInfo) {
        results.push({
          procedure: procedureInfo.name,
          lineNumber: lineNumber,
          affectedRows: affectedRows,
          revision: metadata.revision || 'N/A',
          path: metadata.path || 'N/A',
          code: codeSlice.join('\\n'),
          actualStartLine: startLine + 1,
          actualEndLine: endLine
        });
      }
    }
  });
  
  return results;
}

function findProcedureInSlice(codeLines, startLineNumber) {
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i].trim();
    const match = line.match(/^\\s*(class\\s+)?(procedure|function|constructor|destructor)\\s+([\\w\\.]+)/i);
    
    if (match) {
      return {
        name: match[3],
        type: match[2],
        isClass: !!match[1],
        lineNumber: startLineNumber + i
      };
    }
  }
  
  // If no procedure found, return a generic entry
  return {
    name: 'Code Block',
    type: 'block',
    isClass: false,
    lineNumber: startLineNumber
  };
}

// Export the main function
return analyzeDelphiCode;`;

  useEffect(() => {
    if (code) {
      setEditorCode(code);
    } else {
      setEditorCode(defaultCode);
    }
  }, [code, defaultCode]);

  const handleCodeChange = (e) => {
    const newCode = e?.target?.value;
    setEditorCode(newCode);
    onCodeChange(newCode);
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

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
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
        </div>
      </div>
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
            className="w-full h-96 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            placeholder="Enter your JavaScript code here..."
            spellCheck={false}
          />
          
          <div className="absolute bottom-2 right-2 text-xs text-slate-500">
            Lines: {editorCode?.split('\n')?.length}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-secondary space-y-1">
          <p>• Script receives: fileContent, diffItems, metadata</p>
          <p>• Must return array of analysis results</p>
          <p>• Supports Delphi procedure/function detection</p>
        </div>
        
        <Button
          variant="default"
          iconName="Play"
          iconPosition="left"
          onClick={handleExecute}
          disabled={isProcessing || !editorCode?.trim()}
          loading={isProcessing}
        >
          Execute Script
        </Button>
      </div>
    </div>
  );
};

export default JavaScriptEditor;
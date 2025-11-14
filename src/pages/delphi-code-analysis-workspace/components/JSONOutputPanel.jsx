import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JSONOutputPanel = ({ results, isVisible, onToggle }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(results, null, 2);
    navigator.clipboard?.writeText(jsonString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delphi_analysis_${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary"
        >
          <Icon name={isVisible ? 'ChevronDown' : 'ChevronRight'} size={16} />
          <span className="font-medium">Raw JSON Output</span>
          <span className="text-xs bg-muted px-2 py-1 rounded">
            {results?.length} items
          </span>
        </Button>
        
        {isVisible && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              iconName={isCopied ? 'Check' : 'Copy'}
              onClick={handleCopyJSON}
              className={`text-xs ${isCopied ? 'text-success' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              onClick={handleDownloadJSON}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              Download
            </Button>
          </div>
        )}
      </div>
      {isVisible && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="FileCode" size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-300">analysis_results.json</span>
              </div>
              <div className="text-xs text-slate-400">
                {JSON.stringify(results, null, 2)?.length} characters
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-auto">
            <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
      {isVisible && results?.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Icon name="FileX" size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No Data</h3>
          <p className="text-text-secondary">
            Execute the analysis script to see JSON output
          </p>
        </div>
      )}
    </div>
  );
};

export default JSONOutputPanel;
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CodeViewer = ({ isOpen, onClose, codeData }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !codeData) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(codeData?.code);
  };

  const handleDownload = () => {
    const blob = new Blob([codeData.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${codeData?.procedure}_lines_${codeData?.actualStartLine}-${codeData?.actualEndLine}.pas`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed inset-0 z-50 ${isFullscreen ? '' : 'p-4'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-surface border border-border rounded-lg shadow-xl ${
        isFullscreen ? 'w-full h-full' : 'max-w-4xl mx-auto mt-8 max-h-[80vh]'
      } flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Code2" size={20} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{codeData?.procedure}</h3>
              <p className="text-sm text-text-secondary">
                Lines {codeData?.actualStartLine}-{codeData?.actualEndLine} • {codeData?.path}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Copy"
              onClick={handleCopyCode}
              className="text-text-secondary hover:text-text-primary"
            />
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              onClick={handleDownload}
              className="text-text-secondary hover:text-text-primary"
            />
            <Button
              variant="ghost"
              size="sm"
              iconName={isFullscreen ? 'Minimize2' : 'Maximize2'}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-text-secondary hover:text-text-primary"
            />
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary"
            />
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="bg-slate-900 h-full">
              <div className="flex">
                {/* Line Numbers */}
                <div className="bg-slate-800 px-3 py-4 text-slate-400 text-sm font-mono select-none border-r border-slate-700">
                  {codeData?.code?.split('\n')?.map((_, index) => (
                    <div key={index} className="leading-6 text-right">
                      {codeData?.actualStartLine + index}
                    </div>
                  ))}
                </div>
                
                {/* Code Content */}
                <div className="flex-1 p-4 overflow-x-auto">
                  <pre className="text-slate-100 text-sm font-mono leading-6 whitespace-pre">
                    {codeData?.code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-4 text-xs text-text-secondary">
            <span>Revision: {codeData?.revision}</span>
            <span>•</span>
            <span>Affected Rows: {codeData?.affectedRows}</span>
            <span>•</span>
            <span>Total Lines: {codeData?.code?.split('\n')?.length}</span>
          </div>
          
          <div className="text-xs text-text-secondary">
            Press Esc to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
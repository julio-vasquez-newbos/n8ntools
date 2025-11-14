import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIRefactorPanel = ({ onRefactor, isRefactoring, currentCode }) => {
  const [instructions, setInstructions] = useState('');
  const [refactorHistory, setRefactorHistory] = useState([]);

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

  const useHistoryItem = (item) => {
    setInstructions(item?.instructions);
  };

  const commonInstructions = [
    "Add error handling and validation",
    "Optimize regex patterns for better performance",
    "Add support for nested class methods",
    "Include line number validation",
    "Add comments and documentation"
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon name="Sparkles" size={20} className="text-accent" />
        <h3 className="text-lg font-semibold text-text-primary">AI Code Refactor</h3>
      </div>
      <div className="space-y-3">
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
      {commonInstructions?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Quick Instructions</h4>
          <div className="space-y-1">
            {commonInstructions?.map((instruction, index) => (
              <button
                key={index}
                onClick={() => setInstructions(instruction)}
                className="w-full text-left px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                disabled={isRefactoring}
              >
                {instruction}
              </button>
            ))}
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
            <p><strong>AI Refactor:</strong> Describe modifications in natural language</p>
            <p>Examples: "Add error handling", "Optimize performance", "Add documentation"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRefactorPanel;
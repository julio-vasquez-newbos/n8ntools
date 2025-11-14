import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ErrorDisplay = ({ error, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  const handleCopyError = () => {
    const errorText = `Error: ${error?.message}\n\nStack Trace:\n${error?.stack || 'No stack trace available'}`;
    navigator.clipboard?.writeText(errorText);
  };

  return (
    <div className="bg-error/10 border border-error/20 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Icon name="AlertCircle" size={20} className="text-error mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-error mb-1">Execution Error</h4>
              <p className="text-sm text-error/80">{error?.message}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Copy"
              onClick={handleCopyError}
              className="text-error hover:text-error/80"
            />
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClear}
              className="text-error hover:text-error/80"
            />
          </div>
        </div>

        {error?.stack && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-error hover:text-error/80 p-0"
            >
              <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={16} />
              <span className="text-xs">Stack Trace</span>
            </Button>
          </div>
        )}
      </div>
      {isExpanded && error?.stack && (
        <div className="border-t border-error/20 bg-error/5">
          <pre className="p-4 text-xs font-mono text-error/80 overflow-x-auto">
            {error?.stack}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
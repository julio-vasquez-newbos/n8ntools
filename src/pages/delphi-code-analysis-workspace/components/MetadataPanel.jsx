import React from 'react';
import Input from '../../../components/ui/Input';

const MetadataPanel = ({ metadata, onMetadataChange, isProcessing }) => {
  const handleChange = (field, value) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Metadata</h3>
      <div className="space-y-4">
        <Input
          label="Revision"
          type="text"
          placeholder="e.g., v2.1.0, commit-abc123"
          value={metadata?.revision || ''}
          onChange={(e) => handleChange('revision', e?.target?.value)}
          disabled={isProcessing}
          description="Version or commit identifier for tracking"
        />
        
        <Input
          label="Path"
          type="text"
          placeholder="e.g., /src/modules/core"
          value={metadata?.path || ''}
          onChange={(e) => handleChange('path', e?.target?.value)}
          disabled={isProcessing}
          description="Source file path or module location"
        />
      </div>
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-xs text-text-secondary space-y-1">
          <p><strong>Revision:</strong> Used for version tracking in analysis results</p>
          <p><strong>Path:</strong> Helps organize results by module or directory</p>
        </div>
      </div>
    </div>
  );
};

export default MetadataPanel;
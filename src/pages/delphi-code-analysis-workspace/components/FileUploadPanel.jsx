import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import FileContentViewer from './FileContentViewer';

const FileUploadPanel = ({ onFileUpload, uploadedFile, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'paste'
  const [postUploadTab, setPostUploadTab] = useState('summary'); // 'summary' or 'content'
  const [pasteContent, setPasteContent] = useState('');

  const validateFile = (file) => {
    const name = file?.name?.toLowerCase() || '';
    const supported = ['.pas'];
    if (!supported.some(ext => name.endsWith(ext))) {
      return 'Only .pas files are allowed';
    }
    if (file?.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const validatePasteContent = (content) => {
    if (!content?.trim()) {
      return 'Please paste some .pas code content';
    }
    if (content?.length > 5 * 1024 * 1024) { // 5MB limit for pasted content
      return 'Pasted content is too large (max 5MB)';
    }
    return null;
  };

  const handleFileSelect = useCallback((file) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e?.target?.result;
      onFileUpload({
        name: file?.name,
        content: content,
        size: file?.size,
        lastModified: new Date(file.lastModified),
        source: 'file'
      });
      setPostUploadTab('content');
    };
    reader.readAsText(file, 'UTF-8');
  }, [onFileUpload]);

  const handlePasteProcess = useCallback(() => {
    const error = validatePasteContent(pasteContent);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError('');
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    onFileUpload({
      name: 'pasted-code.pas',
      content: pasteContent,
      size: blob?.size,
      lastModified: new Date(),
      source: 'paste'
    });
    setPasteContent('');
    setPostUploadTab('content');
  }, [pasteContent, onFileUpload]);

  const handleDrag = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === 'dragenter' || e?.type === 'dragover') {
      setDragActive(true);
    } else if (e?.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);

    if (e?.dataTransfer?.files && e?.dataTransfer?.files?.[0]) {
      handleFileSelect(e?.dataTransfer?.files?.[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e?.target?.files && e?.target?.files?.[0]) {
      handleFileSelect(e?.target?.files?.[0]);
    }
  };

  const clearAll = () => {
    onFileUpload(null);
    setPasteContent('');
    setUploadError('');
    setPostUploadTab('summary');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">File Upload</h3>
        {uploadedFile && (
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={clearAll}
            className="text-text-secondary hover:text-error"
          >
            Clear
          </Button>
        )}
      </div>
      {!uploadedFile ? (
        <>
          {/* Tab Navigation */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'file' ?'bg-white text-text-primary shadow-sm' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="Upload" size={16} className="inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'paste' ?'bg-white text-text-primary shadow-sm' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="Edit3" size={16} className="inline mr-2" />
              Paste Code
            </button>
          </div>

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pas"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Icon name="Upload" size={32} className="text-text-secondary" />
                  </div>
                </div>
                
                <div>
                  <p className="text-lg font-medium text-text-primary">
                    Drop your .pas file here
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    or click to browse .pas files
                  </p>
                </div>
                
                <div className="text-xs text-text-secondary">
                  Supports: .pas (UTF-8) • up to 10MB
                </div>
              </div>
            </div>
          )}

          {/* Paste Code Tab */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <Icon name="Code" size={16} className="text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">Paste .pas Code</span>
                  </div>
                </div>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e?.target?.value)}
                  placeholder="Paste your Delphi .pas code here..."
                  className="w-full h-64 p-4 bg-white text-text-primary placeholder-text-secondary resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-text-secondary">
                  {pasteContent ? (
                    <>
                      Lines: {pasteContent?.split('\n')?.length?.toLocaleString()} • 
                      Characters: {pasteContent?.length?.toLocaleString()}
                    </>
                  ) : (
                    'Max 5MB • UTF-8 encoding'
                  )}
                </div>
                
                <Button
                  onClick={handlePasteProcess}
                  disabled={!pasteContent?.trim() || isProcessing}
                  size="sm"
                  className="min-w-[100px]"
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon name="FileText" size={16} className="mr-2" />
                      Process Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setPostUploadTab('summary')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                postUploadTab === 'summary' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="Info" size={16} className="inline mr-2" />
              Summary
            </button>
            <button
              onClick={() => setPostUploadTab('content')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                postUploadTab === 'content' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="FileText" size={16} className="inline mr-2" />
              File Content
            </button>
          </div>
          {postUploadTab === 'summary' && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon 
                    name={uploadedFile?.source === 'paste' ? 'Edit3' : 'FileText'} 
                    size={20} 
                    className="text-success" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {uploadedFile?.name}
                  </h4>
                  <div className="text-xs text-text-secondary space-y-1 mt-1">
                    <p>Size: {(uploadedFile?.size / 1024)?.toFixed(1)} KB</p>
                    <p>Modified: {uploadedFile?.lastModified?.toLocaleDateString()}</p>
                    <p>Lines: {String(uploadedFile?.content || '').split('\n')?.length?.toLocaleString()}</p>
                    <p>Source: {uploadedFile?.source === 'paste' ? 'Pasted Content' : 'Uploaded File'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-xs text-success font-medium">Ready</span>
                </div>
              </div>
            </div>
          )}
          {postUploadTab === 'content' && (
            <FileContentViewer file={uploadedFile} />
          )}
        </>
      )}
      {uploadError && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm text-error font-medium">{uploadError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPanel;
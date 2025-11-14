import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ApplicationHeader = ({ userRole = 'developer', sessionStatus = 'active', onExport, onSaveScript, onHelp }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleExport = () => {
    if (onExport) onExport();
  };

  const handleSaveScript = () => {
    if (onSaveScript) onSaveScript();
  };

  const handleHelp = () => {
    if (onHelp) onHelp();
  };

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logout initiated');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border elevation-1">
      <div className="flex items-center justify-between h-15 px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Icon name="Code2" size={20} color="white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-text-primary leading-tight">
              Delphi Code Analyzer
            </h1>
            <span className="text-xs text-text-secondary leading-tight">
              Professional Code Analysis Tool
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          {/* Global Actions */}
          <div className="flex items-center space-x-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              iconName="Save"
              iconPosition="left"
              onClick={handleSaveScript}
              className="text-text-secondary hover:text-text-primary"
            >
              Save Script
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
              className="text-text-secondary hover:text-text-primary"
            >
              Export Results
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              iconName="HelpCircle"
              iconPosition="left"
              onClick={handleHelp}
              className="text-text-secondary hover:text-text-primary"
            >
              Help
            </Button>
          </div>

          {/* User Context Indicator */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 text-text-secondary hover:text-text-primary"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${sessionStatus === 'active' ? 'bg-success' : 'bg-warning'}`} />
                <span className="text-sm font-medium capitalize">{userRole}</span>
                <Icon name="ChevronDown" size={16} />
              </div>
            </Button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg elevation-2 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">Session Status</p>
                  <p className="text-xs text-text-secondary capitalize">{sessionStatus} • {userRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-muted transition-smooth flex items-center space-x-2"
                >
                  <Icon name="LogOut" size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            iconName="Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-text-secondary hover:text-text-primary"
          />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-border">
          <div className="px-6 py-4 space-y-3">
            <Button
              variant="ghost"
              size="sm"
              iconName="Save"
              iconPosition="left"
              onClick={handleSaveScript}
              fullWidth
              className="justify-start text-text-secondary hover:text-text-primary"
            >
              Save Script
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
              fullWidth
              className="justify-start text-text-secondary hover:text-text-primary"
            >
              Export Results
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              iconName="HelpCircle"
              iconPosition="left"
              onClick={handleHelp}
              fullWidth
              className="justify-start text-text-secondary hover:text-text-primary"
            >
              Help
            </Button>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${sessionStatus === 'active' ? 'bg-success' : 'bg-warning'}`} />
                  <span className="text-sm font-medium text-text-primary capitalize">{userRole}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="LogOut"
                  onClick={handleLogout}
                  className="text-text-secondary hover:text-text-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ApplicationHeader;
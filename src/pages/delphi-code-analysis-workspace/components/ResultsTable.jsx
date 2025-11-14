import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ResultsTable = ({ results, onViewCode, isLoading }) => {
  const [sortField, setSortField] = useState('lineNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = [...results]?.sort((a, b) => {
    let aVal = a?.[sortField];
    let bVal = b?.[sortField];
    
    if (typeof aVal === 'string') {
      aVal = aVal?.toLowerCase();
      bVal = bVal?.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded?.has(index)) {
      newExpanded?.delete(index);
    } else {
      newExpanded?.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-center space-x-3">
          <Icon name="Loader" size={20} className="animate-spin text-primary" />
          <span className="text-text-secondary">Processing analysis...</span>
        </div>
      </div>
    );
  }

  if (results?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Icon name="FileSearch" size={48} className="mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No Results</h3>
        <p className="text-text-secondary">
          Upload a .pas file and configure line items to see analysis results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Analysis Results</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">
            {results?.length} result{results?.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            className="text-xs"
          >
            Export CSV
          </Button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('procedure')}
                    className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  >
                    <span>Procedure</span>
                    <Icon name={getSortIcon('procedure')} size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('lineNumber')}
                    className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  >
                    <span>Line Number</span>
                    <Icon name={getSortIcon('lineNumber')} size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('affectedRows')}
                    className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  >
                    <span>Affected Rows</span>
                    <Icon name={getSortIcon('affectedRows')} size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('revision')}
                    className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  >
                    <span>Revision</span>
                    <Icon name={getSortIcon('revision')} size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('path')}
                    className="flex items-center space-x-1 text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  >
                    <span>Path</span>
                    <Icon name={getSortIcon('path')} size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedResults?.map((result, index) => (
                <React.Fragment key={index}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName={expandedRows?.has(index) ? 'ChevronDown' : 'ChevronRight'}
                          onClick={() => toggleRowExpansion(index)}
                          className="text-text-secondary hover:text-text-primary p-0 w-6 h-6"
                        />
                        <span className="font-medium text-text-primary">{result?.procedure}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{result?.lineNumber}</td>
                    <td className="px-4 py-3 text-text-secondary">{result?.affectedRows}</td>
                    <td className="px-4 py-3 text-text-secondary">{result?.revision}</td>
                    <td className="px-4 py-3 text-text-secondary truncate max-w-32">{result?.path}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => onViewCode(result)}
                        className="text-text-secondary hover:text-text-primary"
                      />
                    </td>
                  </tr>
                  {expandedRows?.has(index) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-muted/30">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-text-primary">Code Preview</h4>
                            <span className="text-xs text-text-secondary">
                              Lines {result?.actualStartLine}-{result?.actualEndLine}
                            </span>
                          </div>
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto max-h-32">
                            {result?.code}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
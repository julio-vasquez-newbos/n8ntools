import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DiffLineItemsTable = ({ diffItems, onDiffItemsChange, isProcessing }) => {
  const [items, setItems] = useState([
    { id: 1, newLineNumber: '', affectedRows: '' }
  ]);

  useEffect(() => {
    if (diffItems && diffItems?.length > 0) {
      setItems(diffItems);
    }
  }, [diffItems]);

  useEffect(() => {
    onDiffItemsChange(items);
  }, [items, onDiffItemsChange]);

  const addRow = () => {
    const newId = Math.max(...items?.map(item => item?.id), 0) + 1;
    setItems([...items, { id: newId, newLineNumber: '', affectedRows: '' }]);
  };

  const removeRow = (id) => {
    if (items?.length > 1) {
      setItems(items?.filter(item => item?.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setItems(items?.map(item => 
      item?.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleKeyDown = (e) => {
    if (e?.ctrlKey) {
      if (e?.key === '=' || e?.key === '+') {
        e?.preventDefault();
        addRow();
      } else if (e?.key === '-') {
        e?.preventDefault();
        if (items?.length > 1) {
          removeRow(items?.[items?.length - 1]?.id);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Diff Line Items</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={addRow}
            disabled={isProcessing}
            className="text-xs"
          >
            Add Row
          </Button>
          <div className="text-xs text-text-secondary">
            Ctrl+Plus/Minus
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Line Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Affected Rows
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items?.map((item, index) => (
                <tr key={item?.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      placeholder="Enter line number"
                      value={item?.newLineNumber}
                      onChange={(e) => updateRow(item?.id, 'newLineNumber', e?.target?.value)}
                      disabled={isProcessing}
                      className="w-full"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      placeholder="Number of rows"
                      value={item?.affectedRows}
                      onChange={(e) => updateRow(item?.id, 'affectedRows', e?.target?.value)}
                      disabled={isProcessing}
                      className="w-full"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => removeRow(item?.id)}
                      disabled={items?.length <= 1 || isProcessing}
                      className="text-text-secondary hover:text-error"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-text-secondary space-y-1">
        <p>• Line numbers are 1-based indexed</p>
        <p>• Affected rows determine the range of code to extract around each line</p>
        <p>• Use keyboard shortcuts: Ctrl+Plus (add row), Ctrl+Minus (remove row)</p>
      </div>
    </div>
  );
};

export default DiffLineItemsTable;
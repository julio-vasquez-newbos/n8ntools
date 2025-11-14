import React, { useMemo, useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const detectType = (file) => {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.pas')) return 'pas';
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.xml')) return 'xml';
  if (name.endsWith('.txt')) return 'text';
  if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cs')) return 'code';
  return 'unknown';
};

const pascalHighlight = (code) => {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = esc(code);
  out = out.replace(/\(\*[\s\S]*?\*\)/g, (m) => `<span class="text-success">${m}</span>`);
  out = out.replace(/\/\/.*$/gm, (m) => `<span class="text-success">${m}</span>`);
  out = out.replace(/'[^']*'/g, (m) => `<span class="text-pink-600">${m}</span>`);
  const keywords = ['program','unit','interface','implementation','uses','begin','end','var','const','type','procedure','function','class','record','if','then','else','for','to','do','while','repeat','until','with','try','except','finally','case','of','inherited','override','private','public','protected','published'];
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  out = out.replace(kwRegex, (m) => `<span class="text-indigo-600 font-medium">${m}</span>`);
  return out;
};

const addLineNumbers = (htmlLines) => {
  return (
    `<table class="table-fixed w-full"><tbody>` +
    htmlLines
      .map((lineHtml, i) => {
        return `<tr><td class="w-12 px-2 text-right align-top select-none text-text-secondary">${i + 1}</td><td class="px-2 align-top font-mono">${lineHtml || ''}</td></tr>`;
      })
      .join('') +
    `</tbody></table>`
  );
};

const renderJSONTree = (value) => {
  if (value === null || typeof value !== 'object') {
    const text = typeof value === 'string' ? `"${value}"` : String(value);
    return <span className="text-text-primary">{text}</span>;
  }
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  return (
    <ul className="pl-4 space-y-1">
      {entries.map(([k, v], idx) => (
        <li key={idx}>
          <span className="text-indigo-600 font-medium">{k}</span>
          <span className="text-text-secondary">: </span>
          {renderJSONTree(v)}
        </li>
      ))}
    </ul>
  );
};

const renderXMLTree = (node) => {
  if (!node) return null;
  if (node.nodeType === 3) {
    const text = node.nodeValue?.trim();
    if (!text) return null;
    return <span className="text-text-primary">{text}</span>;
  }
  const children = Array.from(node.childNodes || []);
  return (
    <ul className="pl-4 space-y-1">
      <li>
        <span className="text-emerald-600">&lt;{node.nodeName}&gt;</span>
        {children.map((c, i) => (
          <div key={i}>{renderXMLTree(c)}</div>
        ))}
        <span className="text-emerald-600">&lt;/{node.nodeName}&gt;</span>
      </li>
    </ul>
  );
};

const SimpleCSVTable = ({ rows }) => {
  return (
    <div className="overflow-auto border border-border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {rows[0]?.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-text-secondary border-b border-border">{String(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((r, ri) => (
            <tr key={ri} className="odd:bg-white even:bg-muted/30">
              {r.map((c, ci) => (
                <td key={ci} className="px-3 py-2 border-b border-border break-words">{String(c ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FileContentViewer = ({ file }) => {
  const [wrap, setWrap] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const type = useMemo(() => detectType(file), [file]);

  const content = file?.content || '';

  const download = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file?.name || 'file';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }, [content, file]);

  const csvRows = useMemo(() => {
    if (type !== 'csv') return null;
    try {
      const lines = content.split(/\r?\n/);
      const rows = lines.map((line) => {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            out.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur);
        return out;
      });
      return rows;
    } catch (e) {
      return null;
    }
  }, [type, content]);

  const renderBody = () => {
    if (!file) return null;
    if (type === 'unknown') {
      return (
        <div className="bg-warning/10 border border-warning/20 rounded-md p-3 text-sm text-warning">
          Unsupported file type. Supported: .pas, .txt, .csv, .json, .xml, .xlsx/.xls
        </div>
      );
    }
    if (type === 'csv') {
      if (!csvRows) {
        return <div className="text-sm text-error">Failed to parse CSV</div>;
      }
      return <SimpleCSVTable rows={csvRows} />;
    }
    if (type === 'json') {
      try {
        const obj = JSON.parse(content);
        if (content.length > 300000) {
          return (
            <div className="max-h-[50vh] overflow-auto border border-border rounded-md">
              <pre className="p-3 whitespace-pre-wrap text-sm">{JSON.stringify(obj, null, 2)}</pre>
            </div>
          );
        }
        return (
          <div className="max-h-[50vh] overflow-auto">
            {renderJSONTree(obj)}
          </div>
        );
      } catch (e) {
        return <div className="text-sm text-error">Invalid JSON</div>;
      }
    }
    if (type === 'xml') {
      try {
        const doc = new DOMParser().parseFromString(content, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length) {
          return <div className="text-sm text-error">Invalid XML</div>;
        }
        return (
          <div className="max-h-[50vh] overflow-auto">
            {renderXMLTree(doc.documentElement)}
          </div>
        );
      } catch (e) {
        return <div className="text-sm text-error">Invalid XML</div>;
      }
    }
    const shouldHighlight = type === 'pas' && content.length <= 500000;
    const htmlStr = shouldHighlight
      ? pascalHighlight(content)
      : content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
    const htmlLines = htmlStr.split('\n');
    const withLines = showLines ? addLineNumbers(htmlLines) : htmlLines.join('<br/>');
    return (
      <div className={`max-h-[50vh] overflow-auto border border-border rounded-md ${wrap ? 'break-words' : 'overflow-x-auto whitespace-pre'}`}>
        <div className="p-3">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: withLines }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="FileText" size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">File Content</span>
          <span className="text-xs text-text-secondary">{file?.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1 text-xs text-text-secondary">
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
            <span>Wrap</span>
          </label>
          <label className="flex items-center space-x-1 text-xs text-text-secondary">
            <input type="checkbox" checked={showLines} onChange={(e) => setShowLines(e.target.checked)} />
            <span>Line numbers</span>
          </label>
          <Button size="sm" variant="ghost" onClick={download} iconName="Download">
            Download
          </Button>
        </div>
      </div>
      {renderBody()}
    </div>
  );
};

export default FileContentViewer;
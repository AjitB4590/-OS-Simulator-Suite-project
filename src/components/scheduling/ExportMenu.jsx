/**
 * Export Menu Dropdown Component.
 * Provides accessible triggers to export the simulation data to CSV,
 * Gantt timeline screenshot to PNG, or a full academic PDF report with inline status feedback.
 */

import { useState, useRef, useEffect } from 'react';
import { exportToCsv } from '../../utils/exportCsv.js';
import { exportToPng } from '../../utils/exportPng.js';
import { exportToPdf } from '../../utils/exportPdf.js';

/**
 * @param {{
 *   result: any,
 *   algorithmName: string,
 *   algorithmId: string,
 *   options?: any,
 *   comparisonResult?: any
 * }} props
 */
export function ExportMenu({ result, algorithmName, algorithmId, options = {}, comparisonResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type) => {
    if (!result) {
      setStatus({ type: 'error', message: 'No simulation data to export. Run simulation first.' });
      return;
    }

    setIsExporting(type);
    setStatus(null);

    let res;
    if (type === 'csv') {
      res = exportToCsv({
        algorithmName,
        algorithmId,
        processes: result.processes,
        metrics: result.metrics,
        options,
      });
    } else if (type === 'png') {
      res = await exportToPng({ algorithmId });
    } else if (type === 'pdf') {
      res = await exportToPdf({
        algorithmName,
        algorithmId,
        options,
        processes: result.processes,
        metrics: result.metrics,
        log: result.log,
        comparisonResult,
      });
    }

    setIsExporting('');
    if (res?.success) {
      setStatus({ type: 'success', message: `Saved ${res.filename}` });
      setTimeout(() => setStatus(null), 4000);
    } else {
      setStatus({ type: 'error', message: res?.error || 'Export failed.' });
    }
    setIsOpen(false);
  };

  return (
    <div className="export-menu-wrapper" ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={!result || !!isExporting}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '40px' }}
      >
        <span>📥</span>
        <span>{isExporting ? `Exporting ${isExporting.toUpperCase()}...` : 'Export Results ▾'}</span>
      </button>

      {isOpen && (
        <div
          className="export-dropdown"
          role="menu"
          aria-label="Export Formats"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            minWidth: '200px',
            padding: '0.4rem 0',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="dropdown-item"
            onClick={() => handleExport('csv')}
          >
            <span>📊</span> Export Metrics (CSV)
          </button>
          <button
            type="button"
            role="menuitem"
            className="dropdown-item"
            onClick={() => handleExport('png')}
          >
            <span>🖼️</span> Export Gantt Chart (PNG 2x)
          </button>
          <button
            type="button"
            role="menuitem"
            className="dropdown-item"
            onClick={() => handleExport('pdf')}
          >
            <span>📑</span> Export Academic Report (PDF)
          </button>
        </div>
      )}

      {status && (
        <div
          aria-live="polite"
          className={`export-status-toast ${status.type === 'error' ? 'toast-error' : 'toast-success'}`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

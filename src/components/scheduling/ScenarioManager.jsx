/**
 * Scenario Manager Component.
 * Enables saving, loading, renaming, deleting, and JSON importing/exporting of simulation workloads.
 * Operates on localStorage ("ossim.scenarios.v1") with strict schema validation and inline error messaging.
 */

import { useState, useRef } from 'react';
import {
  getSavedScenarios,
  saveScenario,
  renameScenario,
  deleteScenario,
  serializeScenario,
  deserializeScenario,
} from '../../utils/scenarios.js';

/**
 * @param {{
 *   currentConfig: any,
 *   onLoadScenario: (data: any) => void
 * }} props
 */
export function ScenarioManager({ currentConfig, onLoadScenario }) {
  const [scenarios, setScenarios] = useState(() => getSavedScenarios());
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setFeedback(null);
    } else {
      setFeedback(msg);
      setErrorMsg(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      notify('Please enter a scenario name.', true);
      return;
    }
    const updated = saveScenario(newName.trim(), currentConfig);
    setScenarios(updated);
    setNewName('');
    notify(`Saved scenario "${newName.trim()}"`);
  };

  const handleRename = (id) => {
    if (!editName.trim()) return;
    const updated = renameScenario(id, editName.trim());
    setScenarios(updated);
    setEditingId(null);
    notify('Scenario renamed.');
  };

  const handleDelete = (id, name) => {
    const updated = deleteScenario(id);
    setScenarios(updated);
    notify(`Deleted "${name}".`);
  };

  const handleExportJson = (sc) => {
    const jsonStr = serializeScenario(sc.data);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-${sc.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported "${sc.name}.json"`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = deserializeScenario(event.target?.result);
      if (!res.success) {
        notify(`Validation error: ${res.errors.join('; ')}`, true);
        return;
      }
      const baseName = file.name.replace(/\.json$/i, '');
      const updated = saveScenario(baseName, res.data);
      setScenarios(updated);
      onLoadScenario(res.data);
      notify(`Imported and applied "${baseName}".`);
    };
    reader.onerror = () => notify('Failed to read scenario file.', true);
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="scenario-manager" aria-label="Scenario Preset Manager">
      {/* 1. Save and Import Actions */}
      <div className="scenario-action-bar">
        <form onSubmit={handleSave} className="scenario-save-form" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexGrow: 1 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Scenario name (e.g. Heavy I/O RR)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flexGrow: 1, minWidth: '180px' }}
            aria-label="New scenario preset name"
          />
          <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            💾 Save Current Setup
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
            aria-label="Upload scenario JSON file"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Import scenario from a JSON file"
          >
            📂 Import JSON
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="error-banner" style={{ marginTop: '0.75rem' }} role="alert">
          {errorMsg}
        </div>
      )}
      {feedback && (
        <div className="feedback-banner" style={{ marginTop: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }} role="status">
          ✓ {feedback}
        </div>
      )}

      {/* 2. Saved Scenarios List */}
      <div className="saved-scenarios-list" style={{ marginTop: '1rem' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Saved Scenarios ({scenarios.length})
        </h4>

        {scenarios.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No saved scenarios yet. Configure a workload above and save it for future experiments.
          </p>
        ) : (
          <div className="scenario-grid">
            {scenarios.map((sc) => (
              <div key={sc.id} className="scenario-item-card">
                <div className="scenario-item-info">
                  {editingId === sc.id ? (
                    <input
                      type="text"
                      className="input-field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(sc.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(sc.id)}
                      autoFocus
                    />
                  ) : (
                    <span className="scenario-item-name" title={sc.name}>{sc.name}</span>
                  )}
                  <span className="scenario-item-date">{new Date(sc.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="scenario-item-buttons">
                  <button
                    type="button"
                    className="btn-sm btn-primary"
                    onClick={() => onLoadScenario(sc.data)}
                    title="Load this scenario into simulator"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn-sm btn-secondary"
                    onClick={() => handleExportJson(sc)}
                    title="Export as JSON file"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    className="btn-sm btn-secondary"
                    onClick={() => { setEditingId(sc.id); setEditName(sc.name); }}
                    title="Rename scenario"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn-sm btn-danger"
                    onClick={() => handleDelete(sc.id, sc.name)}
                    title="Delete scenario"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

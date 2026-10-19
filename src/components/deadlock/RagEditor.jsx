/**
 * Resource Allocation Graph (RAG) Interactive Toolbar and Edge Manager.
 * Supports adding/removing processes, multi-instance resources, request/assignment edges,
 * presets, JSON export/import, and an accessible edge table alternative.
 */

import { useState, useRef } from 'react';
import { RAG_PRESETS } from '../../data/deadlockPresets.js';

/**
 * @param {{
 *   graph: { nodes: any[], edges: any[] },
 *   onChangeGraph: (g: any) => void,
 *   selectedId: string|null,
 *   onSelectNode: (id: string|null) => void
 * }} props
 */
export function RagEditor({ graph, onChangeGraph, selectedId, onSelectNode }) {
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeType, setEdgeType] = useState('request');
  const [resInstances, setResInstances] = useState(1);
  const fileInputRef = useRef(null);

  const handleAddProcess = () => {
    const nextNum = graph.nodes.filter((n) => n.type === 'process').length + 1;
    const newNode = {
      id: `p_${Date.now()}`,
      type: 'process',
      label: `P${nextNum}`,
      x: 100 + (graph.nodes.length * 35) % 480,
      y: 100 + (graph.nodes.length * 25) % 180,
    };
    onChangeGraph({ ...graph, nodes: [...graph.nodes, newNode] });
  };

  const handleAddResource = () => {
    const nextNum = graph.nodes.filter((n) => n.type === 'resource').length + 1;
    const newNode = {
      id: `r_${Date.now()}`,
      type: 'resource',
      label: `R${nextNum}`,
      instances: Math.max(1, resInstances),
      x: 150 + (graph.nodes.length * 35) % 480,
      y: 150 + (graph.nodes.length * 25) % 150,
    };
    onChangeGraph({ ...graph, nodes: [...graph.nodes, newNode] });
  };

  const handleAddEdge = (e) => {
    e.preventDefault();
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    const newEdge = {
      id: `e_${Date.now()}`,
      from: edgeSource,
      to: edgeTarget,
      type: edgeType,
    };
    onChangeGraph({ ...graph, edges: [...graph.edges, newEdge] });
    setEdgeSource('');
    setEdgeTarget('');
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const filteredNodes = graph.nodes.filter((n) => n.id !== selectedId);
    const filteredEdges = graph.edges.filter((e) => e.from !== selectedId && e.to !== selectedId);
    onChangeGraph({ nodes: filteredNodes, edges: filteredEdges });
    onSelectNode(null);
  };

  const handleDeleteEdge = (edgeId) => {
    onChangeGraph({ ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) });
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({ version: '1.0', type: 'rag-graph', ...graph }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-graph-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.nodes && parsed.edges) onChangeGraph(parsed);
      } catch {
        // Silently handled
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processes = graph.nodes.filter((n) => n.type === 'process');
  const resources = graph.nodes.filter((n) => n.type === 'resource');
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  return (
    <div className="rag-editor-panel">
      {/* 1. Main Action Toolbar */}
      <div className="controls-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="select-input"
            onChange={(e) => {
              const p = RAG_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) onChangeGraph(p);
            }}
          >
            <option value="">Load Graph Preset...</option>
            {RAG_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary" onClick={handleAddProcess}>
            ➕ Add Process
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleAddResource}>
              ➕ Add Resource
            </button>
            <input
              type="number"
              className="table-input"
              style={{ width: '48px' }}
              min="1"
              max="5"
              value={resInstances}
              onChange={(e) => setResInstances(Math.max(1, Number(e.target.value)))}
              title="Instances capacity"
            />
          </div>
          {selectedId && (
            <button type="button" className="btn btn-danger" onClick={handleDeleteSelected}>
              🗑️ Delete Selected
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => onChangeGraph({ nodes: [], edges: [] })}>
            Clear
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleExportJson} title="Export graph as JSON">
            💾 Export
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJson} />
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="Import graph JSON">
            📂 Import
          </button>
        </div>
      </div>

      {/* 2. Add Edge Controls */}
      <form onSubmit={handleAddEdge} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', margin: '0.75rem 0' }}>
        <select className="select-input" value={edgeType} onChange={(e) => setEdgeType(e.target.value)}>
          <option value="request">Request (P ➔ R)</option>
          <option value="assignment">Assignment (R ➔ P)</option>
        </select>
        <select className="select-input" value={edgeSource} onChange={(e) => setEdgeSource(e.target.value)}>
          <option value="">Select Source...</option>
          {(edgeType === 'request' ? processes : resources).map((n) => (
            <option key={n.id} value={n.id}>{n.label || n.id}</option>
          ))}
        </select>
        <span>➔</span>
        <select className="select-input" value={edgeTarget} onChange={(e) => setEdgeTarget(e.target.value)}>
          <option value="">Select Target...</option>
          {(edgeType === 'request' ? resources : processes).map((n) => (
            <option key={n.id} value={n.id}>{n.label || n.id}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary" disabled={!edgeSource || !edgeTarget}>
          Add Edge
        </button>
      </form>

      {/* 3. Keyboard-Accessible Edge Table Alternative */}
      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          📋 View & Manage Edges Table ({graph.edges.length})
        </summary>
        <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
          <table className="data-table" aria-label="RAG Edges List">
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Target</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {graph.edges.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No edges added yet.</td>
                </tr>
              ) : (
                graph.edges.map((e) => (
                  <tr key={e.id}>
                    <td><span className={`status-pill ${e.type === 'request' ? 'pill-warn' : 'pill-safe'}`}>{e.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{nodeMap.get(e.from)?.label || e.from}</td>
                    <td style={{ fontWeight: 600 }}>{nodeMap.get(e.to)?.label || e.to}</td>
                    <td>
                      <button type="button" className="btn-sm btn-danger" onClick={() => handleDeleteEdge(e.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/**
 * Resource Allocation Graph Dynamic Event Simulator Component.
 * Supports preset event scripts, user event construction, live step-by-step
 * graph mutation playback, and live Holt's Theorem status updates.
 */

import { useState } from 'react';
import { simulateRagEvents, RAG_EVENT_PRESETS } from '../../algorithms/deadlock/ragEvents.js';
import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { RagCanvas } from './RagCanvas.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

export function RagEventSimulator() {
  const [selectedPreset, setSelectedPreset] = useState(RAG_EVENT_PRESETS[0]);
  const [graph, setGraph] = useState(RAG_EVENT_PRESETS[0].initialGraph);
  const [events, setEvents] = useState(RAG_EVENT_PRESETS[0].events);

  const simulation = simulateRagEvents(graph, events);
  const playback = usePlayback(simulation.steps.length, { initialSpeedMs: 800 });

  const activeStep = simulation.steps[playback.step] || simulation.steps[0];
  const currentSnapshot = activeStep?.snapshot;
  const currentGraph = currentSnapshot?.graph || graph;
  const currentAnalysis = currentSnapshot?.analysis;

  const handleSelectPreset = (id) => {
    const p = RAG_EVENT_PRESETS.find((item) => item.id === id);
    if (p) {
      setSelectedPreset(p);
      setGraph(p.initialGraph);
      setEvents(p.events);
      playback.reset();
    }
  };

  const handleAddEvent = (type) => {
    const processes = graph.nodes.filter((n) => n.type === 'process');
    const resources = graph.nodes.filter((n) => n.type === 'resource');
    if (!processes.length || !resources.length) return;

    const p = processes[0].id;
    const r = resources[0].id;
    const newEvt = type === 'grant'
      ? { type, from: r, to: p, description: `${r.toUpperCase()} granted to ${p.toUpperCase()}` }
      : { type, from: p, to: r, description: `${p.toUpperCase()} ${type}s ${r.toUpperCase()}` };

    setEvents((prev) => [...prev, newEvt]);
    playback.reset();
  };

  const handleRemoveEvent = (idx) => {
    setEvents((prev) => prev.filter((_, i) => i !== idx));
    playback.reset();
  };

  const statusColor = currentAnalysis?.status === 'deadlock'
    ? 'pill-unsafe'
    : currentAnalysis?.status === 'possible-deadlock'
    ? 'pill-warn'
    : 'pill-safe';

  return (
    <div className="rag-event-simulator" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. Preset Selector & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="inline-field" style={{ alignItems: 'center' }}>
          <label htmlFor="rag-event-preset" style={{ fontWeight: 600 }}>Script Preset:</label>
          <select
            id="rag-event-preset"
            className="select-input"
            value={selectedPreset.id}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            {RAG_EVENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-sm btn-secondary" onClick={() => handleAddEvent('request')}>+ Request</button>
          <button type="button" className="btn-sm btn-secondary" onClick={() => handleAddEvent('grant')}>+ Grant</button>
          <button type="button" className="btn-sm btn-secondary" onClick={() => handleAddEvent('release')}>+ Release</button>
          <button type="button" className="btn-sm btn-secondary" onClick={() => setEvents([])}>Clear Events</button>
        </div>
      </div>

      {/* 2. Live Status Badge Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Live Graph State:</span>
        <span className={`status-pill ${statusColor}`}>
          {currentAnalysis?.status ? currentAnalysis.status.toUpperCase() : 'NO DEADLOCK'}
        </span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {currentAnalysis?.message}
        </span>
      </div>

      {/* 3. Live Canvas */}
      <RagCanvas
        nodes={currentGraph.nodes}
        edges={currentGraph.edges}
        cycleNodes={currentAnalysis?.cycleNodes || []}
        cycleEdges={currentAnalysis?.cycleEdges || []}
        activeNode={activeStep?.highlight?.event?.from || null}
      />

      {/* 4. Playback Controls & Step Log */}
      <PlaybackControls playback={playback} totalSteps={simulation.steps.length} stepFormat="step" />

      {/* 5. Event Sequence Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Events:</span>
        {events.map((evt, idx) => (
          <span
            key={idx}
            className="sequence-chip"
            style={{
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              borderColor: idx === playback.step - 1 ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            }}
          >
            {evt.description || `${evt.type}: ${evt.from}➔${evt.to}`}
            <button
              type="button"
              onClick={() => handleRemoveEvent(idx)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: 0 }}
              title="Remove event"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <StepLog steps={simulation.steps} currentStep={playback.step} onJumpTo={playback.jumpTo} title="Event Transition Log" />
    </div>
  );
}

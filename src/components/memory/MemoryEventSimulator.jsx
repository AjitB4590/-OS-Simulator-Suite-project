/**
 * Memory Event Script Simulator Component.
 * Supports chronological event scripts (Allocate, Free + Merge Holes, Compaction),
 * live internal and external fragmentation metrics, presets, and StepLog navigation.
 */

import { useState } from 'react';
import { simulateMemoryEvents, MEMORY_EVENT_PRESETS } from '../../algorithms/memory/memoryEvents.js';
import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { MemoryBar } from './MemoryBar.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

export function MemoryEventSimulator() {
  const presetKeys = Object.keys(MEMORY_EVENT_PRESETS);
  const [selectedPresetKey, setSelectedPresetKey] = useState(presetKeys[0]);
  const [initialBlocks, setInitialBlocks] = useState(MEMORY_EVENT_PRESETS[presetKeys[0]].initialBlocks);
  const [events, setEvents] = useState(MEMORY_EVENT_PRESETS[presetKeys[0]].events);
  const [algo, setAlgo] = useState('firstFit');
  const [newPid, setNewPid] = useState('P5');
  const [newSize, setNewSize] = useState(150);

  const simulation = simulateMemoryEvents(initialBlocks, events, algo);
  const playback = usePlayback(simulation.steps.length, { initialSpeedMs: 700 });

  const activeStep = simulation.steps[playback.step] || simulation.steps[0];
  const stats = activeStep?.snapshot?.stats || simulation.stats;

  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const p = MEMORY_EVENT_PRESETS[key];
    if (p) {
      setInitialBlocks(p.initialBlocks);
      setEvents(p.events);
      playback.reset();
    }
  };

  const handleAddAllocate = () => {
    if (!newPid || newSize <= 0) return;
    setEvents((prev) => [...prev, { type: 'allocate', pid: newPid, size: Number(newSize) }]);
    setNewPid(`P${Number(newPid.replace(/\D/g, '') || 0) + 1}`);
    playback.reset();
  };

  const handleAddFree = () => {
    if (!newPid) return;
    setEvents((prev) => [...prev, { type: 'free', pid: newPid }]);
    playback.reset();
  };

  const handleAddCompact = () => {
    setEvents((prev) => [...prev, { type: 'compact' }]);
    playback.reset();
  };

  return (
    <div className="memory-event-simulator" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* 1. Preset & Strategy Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="inline-field">
            <label htmlFor="mem-event-preset" style={{ fontWeight: 600 }}>Script Preset:</label>
            <select
              id="mem-event-preset"
              className="select-input"
              value={selectedPresetKey}
              onChange={(e) => handleSelectPreset(e.target.value)}
            >
              {presetKeys.map((k) => (
                <option key={k} value={k}>{MEMORY_EVENT_PRESETS[k].name}</option>
              ))}
            </select>
          </div>
          <div className="inline-field">
            <label htmlFor="mem-algo-select" style={{ fontWeight: 600 }}>Allocation Fit:</label>
            <select
              id="mem-algo-select"
              className="select-input"
              value={algo}
              onChange={(e) => { setAlgo(e.target.value); playback.reset(); }}
            >
              <option value="firstFit">First Fit</option>
              <option value="bestFit">Best Fit</option>
              <option value="worstFit">Worst Fit</option>
            </select>
          </div>
        </div>

        {/* Event Construction Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="table-input"
            style={{ width: '50px' }}
            value={newPid}
            onChange={(e) => setNewPid(e.target.value.toUpperCase())}
            placeholder="PID"
            title="Process ID"
          />
          <input
            type="number"
            className="table-input"
            style={{ width: '65px' }}
            value={newSize}
            onChange={(e) => setNewSize(Number(e.target.value))}
            placeholder="KB"
            title="Size in KB"
          />
          <button type="button" className="btn-sm btn-secondary" onClick={handleAddAllocate}>+ Allocate</button>
          <button type="button" className="btn-sm btn-secondary" onClick={handleAddFree}>- Free</button>
          <button type="button" className="btn-sm btn-secondary" onClick={handleAddCompact} title="Coalesce all free holes into 1 contiguous block">🧹 Compact</button>
          <button type="button" className="btn-sm btn-secondary" onClick={() => { setEvents([]); playback.reset(); }}>Clear</button>
        </div>
      </div>

      {/* 2. Live Fragmentation Stats Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Internal Frag: </span>
          <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{stats.internalFragmentation} KB</span>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>External Frag: </span>
          <span style={{ fontWeight: 700, color: stats.externalFragmentation > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
            {stats.externalFragmentation} KB {stats.externalFragmentation > 0 ? '⚠️' : '✓'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used Memory: </span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{stats.usedMemory} / {stats.totalMemory} KB ({stats.utilizationPercent.toFixed(1)}%)</span>
        </div>
      </div>

      {/* 3. Live Memory Bar */}
      <MemoryBar
        blocks={simulation.finalBlocks}
        currentStep={playback.step}
        steps={simulation.steps}
      />

      {/* 4. Playback Controls & Step Log */}
      <PlaybackControls playback={playback} totalSteps={simulation.steps.length} stepFormat="step" />
      <StepLog steps={simulation.steps} currentStep={playback.step} onJumpTo={playback.jumpTo} title="Memory Event Transition Log" />
    </div>
  );
}

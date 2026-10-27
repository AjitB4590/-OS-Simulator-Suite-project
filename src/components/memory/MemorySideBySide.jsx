/**
 * Side-by-Side Memory Allocation Comparison Component.
 * Runs First Fit, Best Fit, and Worst Fit simultaneously on the same event script,
 * driven by a single shared PlaybackControls and StepLog.
 */

import { useState } from 'react';
import { simulateMemoryEvents, MEMORY_EVENT_PRESETS } from '../../algorithms/memory/memoryEvents.js';
import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { MemoryBar } from './MemoryBar.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

export function MemorySideBySide() {
  const presetKeys = Object.keys(MEMORY_EVENT_PRESETS);
  const [selectedPresetKey, setSelectedPresetKey] = useState('classicFitComparison');
  const [initialBlocks, setInitialBlocks] = useState(
    MEMORY_EVENT_PRESETS.classicFitComparison?.initialBlocks || [100, 500, 200, 300, 600]
  );
  const [events, setEvents] = useState(
    MEMORY_EVENT_PRESETS.classicFitComparison?.events || []
  );

  const simFirst = simulateMemoryEvents(initialBlocks, events, 'firstFit');
  const simBest = simulateMemoryEvents(initialBlocks, events, 'bestFit');
  const simWorst = simulateMemoryEvents(initialBlocks, events, 'worstFit');

  const playback = usePlayback(simFirst.steps.length, { initialSpeedMs: 800 });

  const activeFirstStep = simFirst.steps[playback.step] || simFirst.steps[0];
  const activeBestStep = simBest.steps[playback.step] || simBest.steps[0];
  const activeWorstStep = simWorst.steps[playback.step] || simWorst.steps[0];

  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const p = MEMORY_EVENT_PRESETS[key];
    if (p) {
      setInitialBlocks(p.initialBlocks);
      setEvents(p.events);
      playback.reset();
    }
  };

  const algos = [
    { id: 'firstFit', name: 'First Fit', sim: simFirst, active: activeFirstStep, color: 'var(--accent-cyan)' },
    { id: 'bestFit', name: 'Best Fit', sim: simBest, active: activeBestStep, color: 'var(--accent-green)' },
    { id: 'worstFit', name: 'Worst Fit', sim: simWorst, active: activeWorstStep, color: 'var(--accent-amber)' },
  ];

  return (
    <div className="memory-side-by-side" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. Preset Selector & Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="inline-field">
          <label htmlFor="side-by-side-preset" style={{ fontWeight: 600 }}>Script Preset:</label>
          <select
            id="side-by-side-preset"
            className="select-input"
            value={selectedPresetKey}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            {presetKeys.map((k) => (
              <option key={k} value={k}>{MEMORY_EVENT_PRESETS[k].name}</option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {MEMORY_EVENT_PRESETS[selectedPresetKey]?.description}
        </span>
      </div>

      {/* 2. Shared Playback Controller */}
      <PlaybackControls playback={playback} totalSteps={simFirst.steps.length} stepFormat="step" />

      {/* 3. Three Synchronized Memory Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {algos.map((item) => {
          const stats = item.active?.snapshot?.stats || item.sim.stats;
          return (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: item.color }}>
                  {item.name}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <span>Used: <strong>{stats.usedMemory} KB</strong></span>
                  <span>Int Frag: <strong style={{ color: 'var(--accent-amber)' }}>{stats.internalFragmentation} KB</strong></span>
                  <span>Ext Frag: <strong style={{ color: stats.externalFragmentation > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>{stats.externalFragmentation} KB</strong></span>
                </div>
              </div>

              <MemoryBar
                blocks={item.sim.finalBlocks}
                currentStep={playback.step}
                steps={item.sim.steps}
              />
            </div>
          );
        })}
      </div>

      {/* 4. Synchronized Step Log */}
      <StepLog
        steps={simFirst.steps}
        currentStep={playback.step}
        onJumpTo={playback.jumpTo}
        title="Side-by-Side Event Step Log"
      />
    </div>
  );
}

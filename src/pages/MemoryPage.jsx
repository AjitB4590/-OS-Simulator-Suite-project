/**
 * Memory Allocation Module Page.
 * Provides interactive contiguous memory allocation simulation (First Fit, Best Fit, Worst Fit),
 * dynamic vs. fixed partition modes, step-by-step animated playback, cross-algorithm benchmarking,
 * and multi-format export utilities.
 */

import { useState, useMemo } from 'react';
import { Card } from '../components/common/Card.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { MemoryForm } from '../components/memory/MemoryForm.jsx';
import { MemoryBar } from '../components/memory/MemoryBar.jsx';
import { AllocationTable } from '../components/memory/AllocationTable.jsx';
import { MemoryStats } from '../components/memory/MemoryStats.jsx';
import { MemoryCompare } from '../components/memory/MemoryCompare.jsx';
import { MemoryExplanation } from '../components/memory/MemoryExplanation.jsx';
import { getMemoryAlgorithm } from '../algorithms/memory/index.js';
import { usePlayback } from '../hooks/usePlayback.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { exportMemoryToCsv } from '../utils/exportMemoryCsv.js';
import { exportToPng } from '../utils/exportPng.js';

const defaultBlocks = [100, 500, 200, 300, 600];
const defaultProcesses = [
  { pid: 'P1', size: 212 },
  { pid: 'P2', size: 417 },
  { pid: 'P3', size: 112 },
  { pid: 'P4', size: 426 },
];

export function MemoryPage() {
  const [activeTab, setActiveTab] = useState('simulate');
  const [algoId, setAlgoId] = useState('firstFit');
  const [mode, setMode] = useState('dynamic');
  const [isStepMode, setIsStepMode] = useState(false);

  // Persistence with localStorage
  const [savedData, setSavedData] = useLocalStorage('ossim.memory.last_state.v1', {
    blockSizes: defaultBlocks,
    processSizes: defaultProcesses,
  });

  const [blockSizes, setBlockSizes] = useState(() => {
    return Array.isArray(savedData?.blockSizes) && savedData.blockSizes.length > 0
      ? savedData.blockSizes
      : defaultBlocks;
  });

  const [processSizes, setProcessSizes] = useState(() => {
    const list = savedData?.processSizes || savedData?.processes;
    return Array.isArray(list) && list.length > 0
      ? list
      : defaultProcesses;
  });

  const [exportNotice, setExportNotice] = useState(null);

  // Compute simulation result safely
  const simulationResult = useMemo(() => {
    try {
      const algo = getMemoryAlgorithm(algoId);
      const runner = algo?.simulate || algo?.fn;
      if (!runner || !Array.isArray(blockSizes) || !Array.isArray(processSizes)) return null;
      return runner(blockSizes, processSizes, { mode });
    } catch {
      return null;
    }
  }, [algoId, blockSizes, processSizes, mode]);

  // Step playback hook
  const totalSteps = simulationResult?.steps?.length || 0;
  const playback = usePlayback(totalSteps, { initialSpeedMs: 700 });

  const handleUpdateBlocks = (b) => {
    const safeB = Array.isArray(b) && b.length > 0 ? b : defaultBlocks;
    setBlockSizes(safeB);
    setSavedData({ blockSizes: safeB, processSizes });
    playback.reset();
  };

  const handleUpdateProcesses = (p) => {
    const safeP = Array.isArray(p) && p.length > 0 ? p : defaultProcesses;
    setProcessSizes(safeP);
    setSavedData({ blockSizes, processSizes: safeP });
    playback.reset();
  };

  const handleRandomize = () => {
    const numBlocks = Math.floor(Math.random() * 3) + 3; // 3 to 5
    const numProcs = Math.floor(Math.random() * 3) + 3; // 3 to 5
    const newBlocks = Array.from({ length: numBlocks }, () => (Math.floor(Math.random() * 5) + 1) * 100);
    const newProcs = Array.from({ length: numProcs }, (_, i) => ({
      pid: `P${i + 1}`,
      size: Math.floor(Math.random() * 350) + 50,
    }));
    handleUpdateBlocks(newBlocks);
    handleUpdateProcesses(newProcs);
  };

  const handleExportCsv = () => {
    if (!simulationResult) return;
    const res = exportMemoryToCsv({
      algorithmId: algoId,
      partitionMode: mode,
      allocations: simulationResult.allocations,
      blocks: simulationResult.blocks,
      stats: simulationResult.stats,
    });
    setExportNotice(res.success ? `Exported ${res.filename}` : `CSV Export error: ${res.error}`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportPng = async () => {
    const res = await exportToPng({ algorithmId: `memory-${algoId}`, elementId: 'memory-bar-root' });
    setExportNotice(res.success ? `Saved PNG: ${res.filename}` : `PNG Export error: ${res.error}`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportJson = () => {
    const payload = { version: '1.0', module: 'memory', blockSizes, processSizes, mode };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-scenario-${algoId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const b = json.blockSizes;
        const p = json.processSizes || json.processes;
        if (Array.isArray(b) && Array.isArray(p)) {
          handleUpdateBlocks(b);
          handleUpdateProcesses(p);
          if (json.mode) setMode(json.mode);
        }
      } catch {
        setExportNotice('Invalid JSON scenario configuration file.');
        setTimeout(() => setExportNotice(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="memory-page-container">
      {/* Module Sub-Header Navigation Tabs */}
      <div className="sub-nav-tabs" role="tablist" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'simulate'}
          className={`tab-btn ${activeTab === 'simulate' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulate')}
        >
          Allocation Simulator & Timeline
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'compare'}
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          Compare Algorithms
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'theory'}
          className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => setActiveTab('theory')}
        >
          Theory & Trade-offs
        </button>
      </div>

      {exportNotice && <div className="notice-banner" style={{ marginBottom: '1rem' }}>{exportNotice}</div>}

      {/* TAB 1: Simulator & Playback */}
      {activeTab === 'simulate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Memory Allocation Configuration" subtitle="Configure variable block capacities, process requests, and partition strategy">
            <MemoryForm
              blockSizes={blockSizes}
              processSizes={processSizes}
              algoId={algoId}
              mode={mode}
              onChangeBlocks={handleUpdateBlocks}
              onChangeProcesses={handleUpdateProcesses}
              onChangeAlgoId={setAlgoId}
              onChangeMode={setMode}
              onRandomize={handleRandomize}
              onSimulate={() => playback.reset()}
            />

            {/* Scenario Storage Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scenario:</span>
              <button type="button" className="btn btn-secondary" onClick={handleExportJson} style={{ fontSize: '0.75rem' }}>Save JSON</button>
              <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}>
                Load JSON
                <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
              </label>
              <button type="button" className="btn btn-secondary" onClick={handleExportCsv} style={{ fontSize: '0.75rem' }}>Export CSV</button>
              <button type="button" className="btn btn-secondary" onClick={handleExportPng} style={{ fontSize: '0.75rem' }}>Export PNG</button>
            </div>
          </Card>

          {!simulationResult && <ErrorMessage message="Failed to allocate memory. Please ensure blocks and processes are valid positive numbers." />}

          {simulationResult && (
            <>
              {/* Performance Cards */}
              <Card title="Allocation Performance Metrics" subtitle="RAM utilization, internal vs. external fragmentation, and unallocated process tracking">
                <MemoryStats stats={simulationResult.stats} mode={mode} />
              </Card>

              {/* Memory Visualizer with Step-by-Step Playback Controls */}
              <Card
                title="Memory Partition Visualizer"
                subtitle="Proportional visual memory track with allocated slices and hatched free space"
                actions={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isStepMode}
                        onChange={(e) => {
                          setIsStepMode(e.target.checked);
                          playback.reset();
                        }}
                      />
                      Step-by-Step Mode
                    </label>
                  </div>
                }
              >
                {/* Step Controls Bar */}
                {isStepMode && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={playback.reset} title="Reset to start" style={{ padding: '0.3rem 0.55rem' }}>⏮️</button>
                      <button type="button" className="btn btn-secondary" onClick={playback.prev} disabled={playback.step === 0} title="Previous step" style={{ padding: '0.3rem 0.55rem' }}>◀</button>
                      <button type="button" className="btn btn-primary" onClick={playback.isPlaying ? playback.pause : playback.play} style={{ padding: '0.3rem 0.75rem' }}>
                        {playback.isPlaying ? '⏸️ Pause' : '▶ Play'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={playback.next} disabled={playback.step >= totalSteps - 1} title="Next step" style={{ padding: '0.3rem 0.55rem' }}>▶</button>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>
                      Step {totalSteps > 0 ? playback.step + 1 : 0} of {totalSteps}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <label htmlFor="mem-speed">Speed:</label>
                      <input
                        id="mem-speed"
                        type="range"
                        min="200"
                        max="1500"
                        step="100"
                        value={playback.speed}
                        onChange={(e) => playback.setSpeed(Number(e.target.value))}
                        style={{ width: '80px' }}
                      />
                    </div>
                  </div>
                )}

                <MemoryBar
                  blocks={simulationResult.blocks}
                  currentStep={isStepMode ? playback.step : undefined}
                  steps={isStepMode ? simulationResult.steps : undefined}
                />
              </Card>

              {/* Allocation Table */}
              <Card title="Process Allocation Table" subtitle="Detailed per-process placement, block IDs, and remaining capacities">
                <AllocationTable
                  allocations={simulationResult.allocations}
                  blocks={simulationResult.blocks}
                  currentStep={isStepMode ? playback.step : undefined}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Compare Algorithms */}
      {activeTab === 'compare' && (
        <Card title="Algorithm Benchmark Comparison" subtitle="Run First Fit, Best Fit, and Worst Fit simultaneously against the same input workload">
          <MemoryCompare blockSizes={blockSizes} processSizes={processSizes} mode={mode} />
        </Card>
      )}

      {/* TAB 3: Theory & Explanations */}
      {activeTab === 'theory' && (
        <Card title="Theoretical Foundations & Trade-offs" subtitle="Core principles, memory fragmentation definitions, and complexity analysis">
          <MemoryExplanation />
        </Card>
      )}
    </div>
  );
}

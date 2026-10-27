/**
 * Memory Allocation Module Page.
 * Offers four comprehensive sub-modules:
 * 1. Allocation Simulator & Scan Playback (Block-by-block scan, check/cross candidate status, StepLog)
 * 2. Dynamic Event Simulator (Allocate, Free + Merge Holes, Compaction with script presets & live fragmentation)
 * 3. Side-by-Side Synchronized Comparison (First, Best, Worst Fit on same event script with 1 controller)
 * 4. Benchmark Analysis & Theoretical Foundations
 */

import { useState, useMemo } from 'react';
import { Card } from '../components/common/Card.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { PlaybackControls } from '../components/common/PlaybackControls.jsx';
import { StepLog } from '../components/common/StepLog.jsx';
import { MemoryForm } from '../components/memory/MemoryForm.jsx';
import { MemoryBar } from '../components/memory/MemoryBar.jsx';
import { AllocationTable } from '../components/memory/AllocationTable.jsx';
import { MemoryStats } from '../components/memory/MemoryStats.jsx';
import { MemoryCompare } from '../components/memory/MemoryCompare.jsx';
import { MemoryExplanation } from '../components/memory/MemoryExplanation.jsx';
import { MemoryEventSimulator } from '../components/memory/MemoryEventSimulator.jsx';
import { MemorySideBySide } from '../components/memory/MemorySideBySide.jsx';
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

  const totalSteps = simulationResult?.steps?.length || 0;
  const playback = usePlayback(totalSteps, { initialSpeedMs: 700 });

  const activeStep = simulationResult?.steps?.[playback.step] || null;
  const activeBlocks = activeStep?.snapshot?.blocks || simulationResult?.blocks || [];
  const activeAllocations = activeStep?.snapshot?.allocations || [];
  const activeStats = activeStep?.snapshot?.stats || simulationResult?.stats;
  const isFinished = playback.step >= totalSteps - 1;

  const handleRunSimulation = () => {
    playback.jumpTo(0);
    playback.play();
  };

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
    const numBlocks = Math.floor(Math.random() * 3) + 3;
    const numProcs = Math.floor(Math.random() * 3) + 3;
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
    <div className="scheduling-layout memory-page-layout">
      {/* Sub-Header Navigation Tabs */}
      <div className="nav-tabs" role="tablist" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'simulate'}
          className={`nav-link ${activeTab === 'simulate' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulate')}
        >
          📊 Allocation Simulator &amp; Scan Playback
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'events'}
          className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          ⚡ Dynamic Event Simulator
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sideBySide'}
          className={`nav-link ${activeTab === 'sideBySide' ? 'active' : ''}`}
          onClick={() => setActiveTab('sideBySide')}
        >
          ⚖️ Side-by-Side Comparison
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'compare'}
          className={`nav-link ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          📈 Benchmark Metrics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'theory'}
          className={`nav-link ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => setActiveTab('theory')}
        >
          📖 Theory &amp; Trade-offs
        </button>
      </div>

      {exportNotice && <div className="notice-banner" style={{ marginBottom: '1rem' }}>{exportNotice}</div>}

      {/* TAB 1: Simulator & Scan Playback */}
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
              onSimulate={handleRunSimulation}
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
              <Card title="Allocation Performance Metrics" subtitle="RAM utilization, internal vs. external fragmentation, and unallocated process tracking (live step snapshot)">
                <MemoryStats stats={activeStats} mode={mode} />
              </Card>

              {/* Memory Visualizer with Step-by-Step Scan Playback */}
              <Card
                title="Memory Partition Visualizer &amp; Step-by-Step Scan Playback"
                subtitle="Proportional visual memory track with block-by-block inspection checks (✓ fits / ✗ too small) and decision callouts"
              >
                <div style={{ marginBottom: '1rem' }}>
                  <PlaybackControls
                    playback={playback}
                    totalSteps={totalSteps}
                    stepFormat="step"
                  />
                </div>

                <MemoryBar
                  blocks={activeBlocks}
                  currentStep={playback.step}
                  steps={simulationResult.steps}
                />

                <div style={{ marginTop: '1.25rem' }}>
                  <StepLog
                    steps={simulationResult.steps}
                    currentStep={playback.step}
                    onJumpTo={playback.jumpTo}
                    title="Block Inspection &amp; Allocation Step Log"
                  />
                </div>
              </Card>

              {/* Allocation Table */}
              <Card title="Process Allocation Table" subtitle="Detailed per-process placement, scanning status, block IDs, and remaining capacities">
                <AllocationTable
                  allocations={activeAllocations}
                  blocks={activeBlocks}
                  processes={processSizes}
                  activeStep={activeStep}
                  isFinished={isFinished}
                  finalAllocations={simulationResult.allocations}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Dynamic Event Simulator */}
      {activeTab === 'events' && (
        <Card title="Dynamic Memory Event Simulator" subtitle="Simulate Allocate, Free (Merge Adjacent Holes), and Memory Compaction live with real-time fragmentation tracking">
          <MemoryEventSimulator />
        </Card>
      )}

      {/* TAB 3: Side-by-Side Comparison */}
      {activeTab === 'sideBySide' && (
        <Card title="Synchronized Side-by-Side Execution" subtitle="Run First Fit, Best Fit, and Worst Fit simultaneously on the same event script with one shared playback controller">
          <MemorySideBySide />
        </Card>
      )}

      {/* TAB 4: Compare Algorithms */}
      {activeTab === 'compare' && (
        <Card title="Algorithm Benchmark Comparison" subtitle="Run First Fit, Best Fit, and Worst Fit simultaneously against the same input workload">
          <MemoryCompare blockSizes={blockSizes} processSizes={processSizes} mode={mode} />
        </Card>
      )}

      {/* TAB 5: Theory & Explanations */}
      {activeTab === 'theory' && (
        <Card title="Theoretical Foundations & Trade-offs" subtitle="Core principles, memory fragmentation definitions, and complexity analysis">
          <MemoryExplanation />
        </Card>
      )}
    </div>
  );
}

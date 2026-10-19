/**
 * CPU Scheduling Simulator Page.
 * Orchestrates workload configuration, algorithm simulation, step playback,
 * ready queue inspection, progressive metrics, and cross-algorithm benchmarking.
 */

import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { ProcessTable } from '../components/scheduling/ProcessTable.jsx';
import { AlgorithmSelector } from '../components/scheduling/AlgorithmSelector.jsx';
import { PlaybackControls } from '../components/scheduling/PlaybackControls.jsx';
import { ReadyQueueView } from '../components/scheduling/ReadyQueueView.jsx';
import { GanttChart } from '../components/scheduling/GanttChart.jsx';
import { MetricsCards } from '../components/scheduling/MetricsCards.jsx';
import { MetricsTable, StarvationAlert } from '../components/scheduling/MetricsTable.jsx';
import { ExplanationPanel } from '../components/scheduling/ExplanationPanel.jsx';
import { ComparePanel } from '../components/scheduling/ComparePanel.jsx';
import { ExportMenu } from '../components/scheduling/ExportMenu.jsx';
import { ScenarioManager } from '../components/scheduling/ScenarioManager.jsx';
import { useSimulation } from '../hooks/useSimulation.js';
import { usePlayback } from '../hooks/usePlayback.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useTheme } from '../hooks/useTheme.js';
import { getAlgorithm } from '../algorithms/scheduling/index.js';
import { runAllAlgorithms } from '../utils/compare.js';
import { AUTOSAVE_STORAGE_KEY } from '../utils/scenarios.js';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.js';

const INITIAL_PROCESSES = [
  { id: 'row-1', pid: 'P1', at: 0, bt: 5, priority: 2 },
  { id: 'row-2', pid: 'P2', at: 1, bt: 3, priority: 1 },
  { id: 'row-3', pid: 'P3', at: 2, bt: 1, priority: 3 },
];

export function SchedulingPage() {
  const [savedConfig, setSavedConfig] = useLocalStorage(
    AUTOSAVE_STORAGE_KEY,
    { processes: INITIAL_PROCESSES, algoId: 'fcfs', quantum: 2, mlfqQueues: 3, mlfqQuantums: '2, 4, 8', csOverhead: 0, starvationFactor: 2, isStepMode: false },
    { debounceMs: 500 }
  );

  const [processes, setProcesses] = useState(savedConfig.processes || INITIAL_PROCESSES);
  const [algoId, setAlgoId] = useState(savedConfig.algoId || 'fcfs');
  const [quantum, setQuantum] = useState(savedConfig.quantum || 2);
  const [mlfqQueues, setMlfqQueues] = useState(savedConfig.mlfqQueues || 3);
  const [mlfqQuantums, setMlfqQuantums] = useState(savedConfig.mlfqQuantums || '2, 4, 8');
  const [csOverhead, setCsOverhead] = useState(savedConfig.csOverhead ?? 0);
  const [starvationFactor, setStarvationFactor] = useState(savedConfig.starvationFactor || 2);
  const [isStepMode, setIsStepMode] = useState(savedConfig.isStepMode || false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const { isDark } = useTheme();

  // Debounced autosave sync
  useEffect(() => {
    setSavedConfig({ processes, algoId, quantum, mlfqQueues, mlfqQuantums, csOverhead, starvationFactor, isStepMode });
  }, [processes, algoId, quantum, mlfqQueues, mlfqQuantums, csOverhead, starvationFactor, isStepMode, setSavedConfig]);

  const parsedQuantums = mlfqQuantums.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
  const simOptions = {
    quantum,
    queues: mlfqQueues,
    quantums: parsedQuantums.length > 0 ? parsedQuantums : [2, 4, 8],
    contextSwitchOverhead: csOverhead,
    starvationFactor,
  };

  const { result, errors, runSimulation } = useSimulation(processes, algoId, simOptions);
  const activeAlgo = getAlgorithm(algoId);
  const totalSteps = result ? Math.max(...result.gantt.map((b) => b.end), 0) : 0;
  const playback = usePlayback(totalSteps, { initialSpeedMs: 500 });

  const handleSimulate = () => {
    playback.reset();
    runSimulation();
  };

  const handleLoadScenarioData = (sc) => {
    if (sc.processes) setProcesses(sc.processes.map((p, i) => ({ ...p, id: p.id || `sc-${Date.now()}-${i}` })));
    if (sc.algorithmId) setAlgoId(sc.algorithmId);
    if (sc.quantum) setQuantum(sc.quantum);
    if (sc.contextSwitchOverhead !== undefined) setCsOverhead(sc.contextSwitchOverhead);
    if (sc.mlfqConfig?.queues) setMlfqQueues(sc.mlfqConfig.queues);
    if (sc.mlfqConfig?.quantums) setMlfqQuantums(sc.mlfqConfig.quantums.join(', '));
    if (sc.starvationFactor) setStarvationFactor(sc.starvationFactor);
    playback.reset();
  };

  const currentTimelineEntry = result?.timeline?.[playback.step];
  const stepTime = isStepMode ? playback.step : undefined;

  return (
    <div className="scheduling-layout">
      {/* 1. Process Input */}
      <Card title="1. Workload Process Configuration" subtitle="Define arrival times, burst durations, and execution priorities.">
        <ProcessTable
          processes={processes}
          onAdd={() => setProcesses((p) => [...p, { id: `row-${Date.now()}`, pid: `P${p.length + 1}`, at: 0, bt: 2, priority: 1 }])}
          onUpdate={(id, f, v) => setProcesses((p) => p.map((row) => (row.id === id ? { ...row, [f]: v } : row)))}
          onDelete={(id) => setProcesses((p) => p.filter((row) => row.id !== id))}
          onLoadScenario={(scId) => {
            const found = SAMPLE_SCENARIOS.find((sc) => sc.id === scId);
            if (found) handleLoadScenarioData(found);
          }}
          onGenerateRandom={() => {
            const count = Math.floor(Math.random() * 5) + 3;
            setProcesses(Array.from({ length: count }, (_, i) => ({ id: `rnd-${Date.now()}-${i}`, pid: `P${i + 1}`, at: Math.floor(Math.random() * 8), bt: Math.floor(Math.random() * 8) + 1, priority: Math.floor(Math.random() * 4) + 1 })));
          }}
          showPriorityHint={activeAlgo.needsPriority}
        />
      </Card>

      {/* 2. Controls & Presets */}
      <Card
        title="2. Algorithm Simulation Controls"
        subtitle={activeAlgo.description}
        action={<ExportMenu result={result} algorithmName={activeAlgo.name} algorithmId={algoId} options={simOptions} comparisonResult={comparisonResult} />}
      >
        <AlgorithmSelector
          selectedAlgo={algoId} onChangeAlgo={setAlgoId}
          quantum={quantum} onChangeQuantum={setQuantum}
          mlfqQueues={mlfqQueues} onChangeMlfqQueues={setMlfqQueues}
          mlfqQuantums={mlfqQuantums} onChangeMlfqQuantums={setMlfqQuantums}
          csOverhead={csOverhead} onChangeCsOverhead={setCsOverhead}
          starvationFactor={starvationFactor} onChangeStarvationFactor={setStarvationFactor}
          onSimulate={handleSimulate} onCompareAll={() => setComparisonResult(runAllAlgorithms(processes, simOptions))}
        />
        <ErrorMessage errors={errors} />
        <details style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
            💾 Presets & Custom Scenarios Manager (Save / Load / Export JSON)
          </summary>
          <div style={{ marginTop: '0.5rem' }}>
            <ScenarioManager currentConfig={{ algorithmId: algoId, quantum, contextSwitchOverhead: csOverhead, processes }} onLoadScenario={handleLoadScenarioData} />
          </div>
        </details>
      </Card>

      {/* 3. Playback & Ready Queue */}
      <Card
        title="3. Execution State & Step Playback"
        action={
          <button type="button" className="btn-sm btn-secondary" onClick={() => setIsStepMode(!isStepMode)}>
            {isStepMode ? 'Switch to Instant Result' : 'Switch to Step Mode'}
          </button>
        }
      >
        {isStepMode ? (
          <div>
            <PlaybackControls
              step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying}
              onPlay={playback.play} onPause={playback.pause} onNext={playback.next} onPrev={playback.prev} onReset={playback.reset}
              speed={playback.speed} onSpeedChange={playback.setSpeed}
            />
            <ReadyQueueView currentTime={playback.step} totalTime={totalSteps} entry={currentTimelineEntry} />
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Instant Result mode active. Switch to <strong>Step Mode</strong> to step through CPU state and ready queue transitions cycle-by-cycle.
          </p>
        )}
      </Card>

      {/* 4. Gantt Chart */}
      <Card title="4. Execution Timeline (Gantt Chart)" subtitle={result ? `Simulated via ${activeAlgo.name}` : 'Click "Simulate Execution" to generate timeline.'}>
        <GanttChart gantt={result?.gantt || []} upToTime={stepTime} onJumpToTime={isStepMode ? playback.jumpTo : undefined} />
      </Card>

      {/* 5. Metric Cards */}
      {result && (
        <Card title="5. Performance Overview (KPIs)">
          <MetricsCards metrics={result.metrics} />
        </Card>
      )}

      {/* 6. Metrics Table */}
      {result && (
        <Card title="6. Process Completion Metrics Table" subtitle={isStepMode ? `Showing processes completed up to t = ${playback.step}` : 'Comprehensive process statistics'}>
          <MetricsTable processes={result.processes} currentStep={stepTime} />
        </Card>
      )}

      {/* 7. Starvation Alert */}
      {result?.metrics?.starvationWarnings?.length > 0 && (
        <StarvationAlert warnings={result.metrics.starvationWarnings} />
      )}

      {/* 8. Explanation & Log */}
      <Card title="7. Algorithmic Explanation & Calculation Details" collapsible defaultCollapsed={false}>
        <ExplanationPanel algo={activeAlgo} result={result} />
      </Card>

      {/* 9. Cross-Algorithm Benchmark Comparison */}
      {comparisonResult && (
        <Card title="8. Comparative Benchmark (All Algorithms)" collapsible defaultCollapsed={false}>
          <ComparePanel comparisonResult={comparisonResult} isDark={isDark} />
        </Card>
      )}
    </div>
  );
}

/**
 * Deadlock Simulation Module Page.
 * Offers two comprehensive deadlock sub-modules:
 * 1. Banker's Algorithm (Safety State Check with Playback, Need Matrix, Request Evaluation)
 * 2. Resource Allocation Graph (RAG Canvas, 3-Color DFS Cycle Stepping, Event Simulator, Holt's Analysis)
 */

import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { BankersForm } from '../components/deadlock/BankersForm.jsx';
import { SafeSequenceView } from '../components/deadlock/SafeSequenceView.jsx';
import { SafetyTrace } from '../components/deadlock/SafetyTrace.jsx';
import { RequestPanel } from '../components/deadlock/RequestPanel.jsx';
import { RagCanvas } from '../components/deadlock/RagCanvas.jsx';
import { RagEditor } from '../components/deadlock/RagEditor.jsx';
import { RagResult } from '../components/deadlock/RagResult.jsx';
import { RagDfsSimulator } from '../components/deadlock/RagDfsSimulator.jsx';
import { RagEventSimulator } from '../components/deadlock/RagEventSimulator.jsx';
import { computeNeed, isSafe, validateState } from '../algorithms/deadlock/bankers.js';
import { analyzeDeadlock, validateGraph } from '../algorithms/deadlock/rag.js';
import { BANKERS_PRESETS, RAG_PRESETS } from '../data/deadlockPresets.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { usePlayback } from '../hooks/usePlayback.js';

export function DeadlockPage() {
  const [activeTab, setActiveTab] = useState('bankers');

  // 1. Banker's State with localStorage Persistence
  const [savedBankers, setSavedBankers] = useLocalStorage('ossim.bankers.last_state.v1', BANKERS_PRESETS[0], { debounceMs: 500 });
  const [bState, setBState] = useState(() => ({
    ...savedBankers,
    need: computeNeed(savedBankers.max, savedBankers.allocation),
  }));
  const [safetyResult, setSafetyResult] = useState(() => isSafe(bState.allocation, bState.max, bState.available, bState.processNames));
  const safetyPlayback = usePlayback(safetyResult.steps.length, { initialSpeedMs: 700 });

  useEffect(() => {
    setSavedBankers({
      processNames: bState.processNames,
      resourceNames: bState.resourceNames,
      allocation: bState.allocation,
      max: bState.max,
      available: bState.available,
    });
  }, [bState, setSavedBankers]);

  const handleUpdateBankersState = (next) => {
    const need = computeNeed(next.max, next.allocation);
    const updated = { ...next, need };
    setBState(updated);
    const res = isSafe(updated.allocation, updated.max, updated.available, updated.processNames);
    setSafetyResult(res);
    safetyPlayback.reset();
  };

  const handleRandomizeBankers = () => {
    const n = Math.floor(Math.random() * 3) + 3;
    const m = Math.floor(Math.random() * 2) + 2;
    const processNames = Array.from({ length: n }, (_, i) => `P${i}`);
    const resourceNames = ['A', 'B', 'C'].slice(0, m);
    const available = Array.from({ length: m }, () => Math.floor(Math.random() * 4) + 2);
    const max = Array.from({ length: n }, () => Array.from({ length: m }, () => Math.floor(Math.random() * 6) + 2));
    const allocation = max.map((row) => row.map((mx) => Math.floor(Math.random() * (mx + 1))));
    handleUpdateBankersState({ processNames, resourceNames, available, max, allocation });
  };

  const bankersErrors = validateState(bState.allocation, bState.max, bState.available);
  const activeSafetyStep = safetyResult.steps[safetyPlayback.step] || safetyResult.steps[0];
  const highlightRowIndex = activeSafetyStep?.highlight?.processIndex ?? -1;
  const finishedRows = activeSafetyStep?.snapshot?.finish
    ? activeSafetyStep.snapshot.finish.map((f, i) => (f ? i : -1)).filter((i) => i !== -1)
    : [];
  const stuckRows = activeSafetyStep?.highlight?.stuckProcesses
    ? activeSafetyStep.highlight.stuckProcesses.map((p) => bState.processNames.indexOf(p)).filter((i) => i !== -1)
    : [];
  const workVector = activeSafetyStep?.snapshot?.work || null;

  // 2. RAG State with localStorage Persistence
  const [savedRag, setSavedRag] = useLocalStorage('ossim.rag.last_state.v1', RAG_PRESETS[0], { debounceMs: 500 });
  const [ragGraph, setRagGraph] = useState(savedRag);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    setSavedRag(ragGraph);
  }, [ragGraph, setSavedRag]);

  const ragAnalysis = analyzeDeadlock(ragGraph);
  const ragErrors = validateGraph(ragGraph);

  const handleNodeMove = (id, x, y) => {
    setRagGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  };

  return (
    <div className="scheduling-layout deadlock-page-layout">
      {/* Educational Primer Card */}
      <Card title="Deadlock Avoidance & Graph Detection Primer" collapsible defaultCollapsed={true}>
        <div className="primer-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <h4 style={{ color: 'var(--accent-cyan)' }}>What is Deadlock?</h4>
            <p>A permanent blocking state where every process in a set waits for a resource held by another process in that same set.</p>
            <h4 style={{ color: 'var(--accent-amber)', marginTop: '0.5rem' }}>4 Coffman Conditions</h4>
            <p>1. Mutual Exclusion 2. Hold and Wait 3. No Preemption 4. Circular Wait.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-green)' }}>Safe vs. Unsafe State</h4>
            <p>An unsafe state is <em>not</em> deadlock, but deadlock can only occur from an unsafe state. Banker&apos;s algorithm avoids deadlock by ensuring the system remains in a safe state.</p>
            <h4 style={{ color: 'var(--accent-rose)', marginTop: '0.5rem' }}>RAG Holt Theorem (1972)</h4>
            <p>A cycle in a single-instance graph guarantees deadlock. In multi-instance graphs, a cycle is necessary but not sufficient.</p>
          </div>
        </div>
      </Card>

      {/* Module Tabs Header */}
      <div className="nav-tabs" style={{ alignSelf: 'flex-start' }} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bankers'}
          className={`nav-link ${activeTab === 'bankers' ? 'active' : ''}`}
          onClick={() => setActiveTab('bankers')}
        >
          🏦 Banker&apos;s Algorithm
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rag'}
          className={`nav-link ${activeTab === 'rag' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag')}
        >
          🕸️ Resource Allocation Graph (RAG)
        </button>
      </div>

      {/* TAB 1: Banker's Algorithm */}
      {activeTab === 'bankers' && (
        <>
          <Card title="1. Banker's Matrices & Configuration" subtitle="Configure Allocation, Max claims, and Available resource instances.">
            <ErrorMessage errors={bankersErrors} />
            <BankersForm
              state={bState}
              onChangeState={handleUpdateBankersState}
              onCheckSafety={() => {
                const res = isSafe(bState.allocation, bState.max, bState.available, bState.processNames);
                setSafetyResult(res);
                safetyPlayback.reset();
              }}
              onRandomize={handleRandomizeBankers}
              highlightRowIndex={highlightRowIndex}
              finishedRows={finishedRows}
              stuckRows={stuckRows}
              workVector={workVector}
              activeStep={activeSafetyStep}
            />
          </Card>

          <Card title="2. System Safety Evaluation & Execution Sequence">
            <SafeSequenceView
              safe={safetyResult.safe}
              sequence={safetyResult.sequence}
              currentSequence={activeSafetyStep?.snapshot?.safeSequence}
              stuckProcesses={activeSafetyStep?.highlight?.stuckProcesses}
              explanation={activeSafetyStep?.explanation}
            />
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Safety Algorithm Step-by-Step Playback</h4>
              <SafetyTrace steps={safetyResult.steps} playback={safetyPlayback} />
            </div>
          </Card>

          <Card title="3. Resource-Request Simulator" subtitle="Test if a specific process request can be granted immediately without causing deadlock.">
            <RequestPanel
              processNames={bState.processNames}
              resourceNames={bState.resourceNames}
              allocation={bState.allocation}
              max={bState.max}
              available={bState.available}
              onApplyState={(newState) => handleUpdateBankersState({ ...bState, ...newState })}
            />
          </Card>
        </>
      )}

      {/* TAB 2: Resource Allocation Graph */}
      {activeTab === 'rag' && (
        <>
          <Card title="1. Resource Allocation Graph Editor" subtitle="Drag nodes to reposition. Add request (P ➔ R) and assignment (R ➔ P) edges.">
            <ErrorMessage errors={ragErrors} />
            <RagEditor
              graph={ragGraph}
              onChangeGraph={setRagGraph}
              selectedId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
            <div style={{ marginTop: '1rem' }}>
              <RagCanvas
                nodes={ragGraph.nodes}
                edges={ragGraph.edges}
                cycleNodes={ragAnalysis.cycleNodes}
                cycleEdges={ragAnalysis.cycleEdges}
                selectedId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onNodeMove={handleNodeMove}
              />
            </div>
          </Card>

          <Card title="2. 3-Color DFS Cycle Detection Simulation" subtitle="Step-by-step playback: white/gray/black node coloring, DFS stack chips, and cycle discovery.">
            <RagDfsSimulator
              graph={ragGraph}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onNodeMove={handleNodeMove}
            />
          </Card>

          <Card title="3. Dynamic Event Simulator" subtitle="Build or run chronological event scripts live with instant deadlock analysis.">
            <RagEventSimulator />
          </Card>

          <Card title="4. Holt's Theorem Deadlock Summary">
            <RagResult analysis={ragAnalysis} />
          </Card>
        </>
      )}
    </div>
  );
}

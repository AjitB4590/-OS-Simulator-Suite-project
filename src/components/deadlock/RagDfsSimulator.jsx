/**
 * 3-Color DFS Cycle Detection Interactive Stepping Playback Component.
 * Animates graph cycle discovery with white/gray/black node states,
 * active edge traversal, dynamic DFS stack chips, and back-edge cycle display.
 */

import { useMemo } from 'react';
import { simulateRagDfs } from '../../algorithms/deadlock/ragDfs.js';
import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { RagCanvas } from './RagCanvas.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

/**
 * @param {{
 *   graph: { nodes: any[], edges: any[] },
 *   selectedNodeId?: string | null,
 *   onSelectNode?: (id: string) => void,
 *   onNodeMove?: (id: string, x: number, y: number) => void
 * }} props
 */
export function RagDfsSimulator({ graph, selectedNodeId, onSelectNode, onNodeMove }) {
  const simulation = useMemo(() => simulateRagDfs(graph), [graph]);
  const playback = usePlayback(simulation.steps.length, { initialSpeedMs: 700 });

  const activeStep = simulation.steps[playback.step] || simulation.steps[0];
  const highlight = activeStep?.highlight || {};

  return (
    <div className="rag-dfs-simulator" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* 1. Playback Stepper Controls */}
      <PlaybackControls
        playback={playback}
        totalSteps={simulation.steps.length}
        stepFormat="step"
      />

      {/* 2. Step Title & Live Explanation Callout */}
      <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: highlight.cycleNodes?.length ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            {activeStep?.title}
          </span>
          {simulation.hasCycle && (
            <span className="status-pill pill-unsafe" style={{ fontSize: '0.75rem' }}>
              Cycle Detected
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          {activeStep?.explanation}
        </p>
      </div>

      {/* 3. Live Canvas with 3-Color Fills & Stack */}
      <RagCanvas
        nodes={graph.nodes}
        edges={graph.edges}
        colorMap={highlight.colorMap || {}}
        activeNode={highlight.activeNode || null}
        activeEdge={highlight.activeEdge || null}
        dfsStack={highlight.stack || []}
        cycleNodes={highlight.cycleNodes || []}
        cycleEdges={highlight.cycleEdges || []}
        selectedId={selectedNodeId}
        onSelectNode={onSelectNode}
        onNodeMove={onNodeMove}
      />

      {/* 4. Reusable Step Log */}
      <StepLog
        steps={simulation.steps}
        currentStep={playback.step}
        onJumpTo={playback.jumpTo}
        title="DFS Traversal Step Log"
      />
    </div>
  );
}

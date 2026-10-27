/**
 * Interactive SVG Canvas for Resource Allocation Graphs (RAG).
 * Renders processes (circles), resources (rectangles with instance dots),
 * directed request/assignment edges, 3-color DFS stepping highlights, and cycle detection.
 */

import { useState } from 'react';

/**
 * @param {{
 *   nodes: Array<{ id: string, type: 'process'|'resource', label: string, instances?: number, x: number, y: number }>,
 *   edges: Array<{ id?: string, from: string, to: string, type: 'request'|'assignment' }>,
 *   cycleNodes?: string[],
 *   cycleEdges?: Array<{ from: string, to: string }>,
 *   colorMap?: Record<string, 'white' | 'gray' | 'black'>,
 *   activeNode?: string | null,
 *   activeEdge?: { from: string, to: string } | null,
 *   dfsStack?: string[],
 *   selectedId?: string | null,
 *   onSelectNode?: (id: string) => void,
 *   onNodeMove?: (id: string, x: number, y: number) => void
 * }} props
 */
export function RagCanvas({
  nodes,
  edges,
  cycleNodes = [],
  cycleEdges = [],
  colorMap = {},
  activeNode = null,
  activeEdge = null,
  dfsStack = [],
  selectedId,
  onSelectNode,
  onNodeMove,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const handlePointerDown = (e, node) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* Ignore */ }
    setDraggingId(node.id);
    setOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    onSelectNode?.(node.id);
  };

  const handlePointerMove = (e) => {
    if (!draggingId || !onNodeMove) return;
    const nextX = Math.max(35, Math.min(665, e.clientX - offset.x));
    const nextY = Math.max(35, Math.min(325, e.clientY - offset.y));
    onNodeMove(draggingId, nextX, nextY);
  };

  const handlePointerUp = (e) => {
    if (draggingId) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* Ignore */ }
      setDraggingId(null);
    }
  };

  const getNodeFill = (node) => {
    if (cycleNodes.includes(node.id)) return 'rgba(244, 63, 94, 0.2)';
    const color = colorMap[node.id];
    if (color === 'gray') return 'rgba(245, 158, 11, 0.25)';
    if (color === 'black') return 'rgba(15, 23, 42, 0.65)';
    return 'var(--bg-surface)';
  };

  const getNodeStroke = (node) => {
    if (cycleNodes.includes(node.id)) return 'var(--accent-rose)';
    if (activeNode === node.id) return 'var(--accent-cyan)';
    const color = colorMap[node.id];
    if (color === 'gray') return 'var(--accent-amber)';
    if (color === 'black') return 'var(--text-muted)';
    return selectedId === node.id ? 'var(--accent-cyan)' : 'var(--border-subtle)';
  };

  return (
    <div className="rag-canvas-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* DFS Stack & Color Legend Indicator */}
      {(dfsStack.length > 0 || Object.keys(colorMap).length > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>DFS Stack:</span>
            {dfsStack.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>(empty)</span>
            ) : (
              dfsStack.map((id, idx) => (
                <span key={id} className="sequence-chip" style={{ fontSize: '0.75rem', padding: '2px 8px', background: idx === dfsStack.length - 1 ? 'var(--accent-amber)' : undefined, color: idx === dfsStack.length - 1 ? '#000' : undefined }}>
                  {nodeMap.get(id)?.label || id}
                </span>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', color: 'var(--text-muted)' }}>
            <span>⚪ White (Unvisited)</span>
            <span style={{ color: 'var(--accent-amber)' }}>🟡 Gray (In Stack)</span>
            <span>⚫ Black (Done)</span>
            <span style={{ color: 'var(--accent-rose)' }}>🔴 Cycle</span>
          </div>
        </div>
      )}

      <svg
        className="rag-svg"
        viewBox="0 0 700 360"
        style={{ minWidth: '550px', width: '100%', height: '360px', background: 'var(--bg-card-solid)', borderRadius: 'var(--radius-md)' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <marker id="arrow-req" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-amber)" />
          </marker>
          <marker id="arrow-assign" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-cyan)" />
          </marker>
          <marker id="arrow-cycle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-rose)" />
          </marker>
        </defs>

        {/* 1. Edges */}
        {edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const isCycle = cycleEdges.some((ce) => ce.from === edge.from && ce.to === edge.to);
          const isActive = activeEdge && activeEdge.from === edge.from && activeEdge.to === edge.to;
          const isReq = edge.type === 'request';
          const stroke = isCycle ? 'var(--accent-rose)' : isActive ? 'var(--accent-cyan)' : isReq ? 'var(--accent-amber)' : 'var(--accent-cyan)';
          const marker = isCycle ? 'url(#arrow-cycle)' : isReq ? 'url(#arrow-req)' : 'url(#arrow-assign)';

          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          const targetPad = to.type === 'process' ? 24 : 26;
          const endX = to.x - targetPad * Math.cos(angle);
          const endY = to.y - targetPad * Math.sin(angle);

          return (
            <line
              key={edge.id || `${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={endX}
              y2={endY}
              stroke={stroke}
              strokeWidth={isCycle ? 3.5 : isActive ? 3 : 2}
              strokeDasharray={isReq ? '5,4' : undefined}
              markerEnd={marker}
            />
          );
        })}

        {/* 2. Nodes */}
        {nodes.map((node) => {
          const isCycle = cycleNodes.includes(node.id);
          const isProc = node.type === 'process';

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onPointerDown={(e) => handlePointerDown(e, node)}
              style={{ cursor: 'grab' }}
            >
              {isProc ? (
                <circle
                  r={22}
                  fill={getNodeFill(node)}
                  stroke={getNodeStroke(node)}
                  strokeWidth={isCycle || activeNode === node.id ? 3 : 1.5}
                />
              ) : (
                <g>
                  <rect
                    x={-26}
                    y={-20}
                    width={52}
                    height={40}
                    rx={6}
                    fill={getNodeFill(node)}
                    stroke={getNodeStroke(node)}
                    strokeWidth={isCycle || activeNode === node.id ? 3 : 1.5}
                  />
                  {Array.from({ length: node.instances || 1 }).map((_, i) => {
                    const total = node.instances || 1;
                    const dotX = total === 1 ? 0 : -14 + i * (28 / (total - 1));
                    return <circle key={i} cx={dotX} cy={8} r={3} fill="var(--text-muted)" />;
                  })}
                </g>
              )}
              <text
                y={isProc ? 5 : -4}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill={isCycle ? 'var(--accent-rose)' : 'var(--text-primary)'}
                pointerEvents="none"
              >
                {node.label || node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

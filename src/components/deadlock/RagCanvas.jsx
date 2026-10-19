/**
 * Interactive SVG Canvas for Resource Allocation Graphs (RAG).
 * Renders processes (circles) and resources (rectangles with instance dots),
 * directed request/assignment edges with arrowheads, touch/pointer dragging, and cycle highlighting.
 */

import { useState } from 'react';

/**
 * @param {{
 *   nodes: Array<{ id: string, type: 'process'|'resource', label: string, instances?: number, x: number, y: number }>,
 *   edges: Array<{ id: string, from: string, to: string, type: 'request'|'assignment' }>,
 *   cycleNodes?: string[],
 *   cycleEdges?: Array<{ from: string, to: string }>,
 *   selectedId?: string|null,
 *   onSelectNode?: (id: string) => void,
 *   onNodeMove?: (id: string, x: number, y: number) => void
 * }} props
 */
export function RagCanvas({
  nodes,
  edges,
  cycleNodes = [],
  cycleEdges = [],
  selectedId,
  onSelectNode,
  onNodeMove,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const handlePointerDown = (e, node) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
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
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      setDraggingId(null);
    }
  };

  return (
    <div className="rag-canvas-wrapper" style={{ overflowX: 'auto', touchAction: 'none' }}>
      <svg
        className="rag-svg"
        viewBox="0 0 700 360"
        style={{ minWidth: '550px', width: '100%', height: '360px', background: 'var(--bg-card-solid)', borderRadius: 'var(--radius-md)' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          {/* Default Edge Markers */}
          <marker id="arrow-req" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-amber)" />
          </marker>
          <marker id="arrow-assign" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-cyan)" />
          </marker>
          {/* Highlighted Cycle Edge Marker */}
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
          const isReq = edge.type === 'request';
          const stroke = isCycle ? 'var(--accent-rose)' : isReq ? 'var(--accent-amber)' : 'var(--accent-cyan)';
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
              strokeWidth={isCycle ? 3 : 2}
              strokeDasharray={isReq ? '5,4' : undefined}
              markerEnd={marker}
              style={{ transition: 'stroke 150ms ease' }}
            />
          );
        })}

        {/* 2. Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
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
                /* Process Circle */
                <circle
                  r={22}
                  fill="var(--bg-surface)"
                  stroke={isCycle ? 'var(--accent-rose)' : isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}
                  strokeWidth={isCycle || isSelected ? 3 : 1.5}
                />
              ) : (
                /* Resource Rectangle */
                <g>
                  <rect
                    x={-26}
                    y={-20}
                    width={52}
                    height={40}
                    rx={6}
                    fill="var(--bg-surface)"
                    stroke={isCycle ? 'var(--accent-rose)' : isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}
                    strokeWidth={isCycle || isSelected ? 3 : 1.5}
                  />
                  {/* Instance Indicator Dots inside Resource */}
                  {Array.from({ length: node.instances || 1 }).map((_, i) => {
                    const total = node.instances || 1;
                    const dotX = total === 1 ? 0 : -14 + i * (28 / (total - 1));
                    return <circle key={i} cx={dotX} cy={8} r={3} fill="var(--text-muted)" />;
                  })}
                </g>
              )}

              {/* Node Label */}
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

# Project Progress: OS Simulator Suite

## Executive Summary
The **OS Simulator Suite** is a full-featured, modular academic operating system simulation workbench built with **React 18 + Vite**, **React Router v6**, **Recharts**, and pure **CSS Custom Properties**. The suite provides unified, step-by-step interactive **SIMULATION** across all three core OS modules: **CPU Scheduling**, **Deadlock Avoidance & Detection**, and **Memory Management**. The suite is 100% test-covered (78 unit tests across 21 test files), clean of ESLint warnings, builds cleanly for production, and includes comprehensive architecture and viva presentation documentation.

---

## Architectural Principles & Simulation Contracts
- **Pure Algorithms (No React)**: Algorithm engines reside under `src/algorithms/` and take raw inputs, returning deterministic `{ steps, ... }` result objects. The UI only displays step $N$ from snapshots and never recomputes algorithm logic.
- **Universal Step Contract**:
  ```javascript
  {
    index: number,          // 0-indexed sequential step identifier
    title: string,          // Concise title of the operation
    explanation: string,    // Plain-English description of WHAT happened and WHY
    highlight: object,      // Module-specific visual highlight markers (active nodes, rows, edges, fits/cross)
    snapshot: object        // State snapshot at step N (blocks, allocations, graph, work, metrics)
  }
  ```
- **Unified Reusable Playback Architecture**:
  - `src/components/common/PlaybackControls.jsx`: Shared across all modules; supports both continuous `time` format (CPU Scheduling) and discrete `step` format (Banker's, RAG, Memory), with play, pause, next, prev, reset, and speed slider.
  - `src/components/common/StepLog.jsx`: Shared list of all execution steps with index badges, titles, explanations, auto-scroll to the active step, and click-to-jump seeking.

---

## 1. CPU Scheduling Simulation Engine
- [x] **8 Core Scheduling Algorithms**: FCFS, SJF (Non-preemptive), SRTF (Preemptive SJF), Priority Non-preemptive, Priority Preemptive, Round Robin, HRRN, MLFQ.
- [x] **Timeline Recording & Playback**: Second-by-second execution steps with ready queue states, active core process, and proportional Gantt cursor.
- [x] **Context Switching & Starvation**: Context switch overhead blocks (`"CS"`) with accurate utilization calculations, and automatic starvation alerts ($WT > 5 \times BT$).
- [x] **Comparative Benchmarking & Exports**: Multi-algorithm comparison table, Recharts grouped bar chart, RFC-4180 CSV export, 2x PNG capture, and multi-page PDF generation.

---

## 2. Deadlock Avoidance & Graph Detection Simulation Engine
- [x] **Banker's Algorithm (`src/algorithms/deadlock/bankers.js`)**:
  - **Safety Check Step Playback**:
    - Highlights the examined process row in Allocation and Need matrices.
    - Displays dynamic live Work vector update after each completed process releases resources.
    - Displays colored check/cross badge (`Need ≤ Work: ✓ YES / ✗ NO`).
    - Marks finished processes with a green checkmark tick (✓).
    - Progressively constructs the safe execution sequence $\langle P_1 \to P_3 \dots \rangle$ one process at a time.
    - If no process can run, clearly halts with `"No process can proceed: UNSAFE state"` and highlights all stuck processes in red.
  - **Request Simulation Playback**:
    - Step 1: Claim Check ($Request \le Need$).
    - Step 2: Availability Check ($Request \le Available$).
    - Step 3: Pretend-Allocation (temporary Available, Allocation, Need).
    - Steps 4+: Nested safety algorithm run.
    - Final Step: Final decision (`GRANTED` / `MUST WAIT` / `UNSAFE`) with explicit explanation.
- [x] **Resource Allocation Graph Simulation (`src/algorithms/deadlock/rag.js`)**:
  - **3-Color DFS Cycle Detection Playback (`ragDfs.js`)**:
    - Step-by-step white/gray/black node coloring (White = unvisited, Gray = in DFS stack, Black = fully explored).
    - Highlights the currently explored edge in cyan.
    - Dynamic DFS stack chips showing recursive exploration path.
    - Back edge detection immediately highlights the circular wait path in red with Holt's Theorem analysis.
  - **Dynamic Event Simulation (`ragEvents.js`)**:
    - Live graph mutation engine for `request` ($P \to R$), `grant` ($R \to P$), and `release` events.
    - Live cycle check after every event step with status badge (`NO DEADLOCK`, `POSSIBLE DEADLOCK`, `DEADLOCK`).
    - Built-in script presets: Circular Wait Deadlock Script vs. Orderly Safe Acquisition Script.
    - Custom event builder to append/remove request, grant, and release actions interactively.

---

## 3. Memory Allocation & Compaction Simulation Engine
- [x] **Block-by-Block Scan Playback (`src/algorithms/memory/`)**:
  - `firstFit.js`: Sequential scan stepping through blocks with check/cross (`✓ fits` / `✗ too small`), immediately picking the first qualifying block.
  - `bestFit.js`: Exhaustive scan highlighting candidate blocks, showing current best candidate, and choosing the smallest qualifying block to minimize leftover hole size.
  - `worstFit.js`: Exhaustive scan tracking current largest block, choosing the block that maximizes leftover hole size.
  - Visual memory bar directly updates after each allocation using algorithm snapshots with dashed cyan/rose checking borders and solid green decision borders.
- [x] **Dynamic Memory Events (`memoryEvents.js`)**:
  - **Allocate Process**: Placed into partition according to active fit algorithm.
  - **Free Process**: Releases partition; space returns as an available hole.
  - **Adjacent Hole Coalescing**: Automatically merges adjacent free blocks into a single contiguous hole.
  - **Compaction**: Shifts all active processes to low addresses, coalescing all scattered free holes into a single contiguous block at high memory addresses.
  - Live calculations of **Internal Fragmentation** (fixed mode) and **External Fragmentation** (variable mode) at every single event step.
- [x] **Event Script Editor & Presets**:
  - `extFragCompaction`: Non-adjacent allocations and frees causing an allocation to fail due to external fragmentation, followed by compaction resolving it.
  - `adjacentMerge`: Neighboring processes release memory, automatically coalescing holes into a larger partition.
  - `classicFitComparison`: Textbook dataset comparing First, Best, and Worst fit placements.
- [x] **Synchronized Side-by-Side Comparison (`MemorySideBySide.jsx`)**:
  - Runs First Fit, Best Fit, and Worst Fit simultaneously on the same event script.
  - Driven by a single shared `PlaybackControls` and `StepLog`.
  - Displays all 3 visual memory bars and live fragmentation metrics evolving in lockstep.

---

## Full File Map

```text
os-simulator-suite/
├── docs/
│   ├── ARCHITECTURE.md                          # Architecture specification, layers, and data flow
│   └── PRESENTATION_GUIDE.md                    # 10-min demo script, file map, and 12 viva Q&As
├── README.md                                    # Project documentation and getting started guide
├── PROGRESS.md                                  # Complete development log and contract specifications
├── package.json                                 # Project dependencies and script declarations
├── vite.config.js                               # Vite & Vitest configuration
├── eslint.config.js                             # ESLint 9 flat configuration
├── index.html                                   # HTML5 entry shell
├── src/
│   ├── main.jsx                                 # React DOM mount
│   ├── App.jsx                                  # Root shell, routing, and ErrorBoundary
│   ├── algorithms/
│   │   ├── scheduling/                          # FCFS, SJF, SRTF, RR, Priority, HRRN, MLFQ
│   │   ├── deadlock/
│   │   │   ├── bankers.js                       # Banker's Safety & Request algorithm with steps
│   │   │   ├── rag.js                           # RAG detection, cycle analysis & exports
│   │   │   ├── ragDfs.js                        # 3-color DFS cycle stepping simulation
│   │   │   └── ragEvents.js                     # Dynamic RAG event simulation & presets
│   │   └── memory/
│   │       ├── firstFit.js                      # First Fit with block scanning steps
│   │       ├── bestFit.js                       # Best Fit with candidate scan steps
│   │       ├── worstFit.js                      # Worst Fit with candidate scan steps
│   │       ├── shared.js                        # Memory normalization and fragmentation math
│   │       ├── memoryEvents.js                  # Dynamic event simulator (free, merge, compact)
│   │       └── index.js                         # Memory algorithm registry & exports
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx                       # Navigation bar
│   │   │   ├── ThemeToggle.jsx                  # Dark/light switcher
│   │   │   ├── Card.jsx                         # Collapsible card container
│   │   │   ├── ErrorMessage.jsx                 # Inline alert banner
│   │   │   ├── ErrorBoundary.jsx                # Module error boundary
│   │   │   ├── PlaybackControls.jsx             # Universal PlaybackControls (time & step modes)
│   │   │   └── StepLog.jsx                      # Universal clickable StepLog component
│   │   ├── scheduling/                          # Scheduling tables, Gantt, queue, metrics
│   │   ├── deadlock/
│   │   │   ├── BankersForm.jsx                  # Banker's configuration and live Work vector
│   │   │   ├── MatrixInput.jsx                  # Tabular matrix input with row highlights
│   │   │   ├── NeedMatrix.jsx                   # Reactive Need matrix
│   │   │   ├── SafeSequenceView.jsx             # Progressive safe sequence & stuck processes
│   │   │   ├── SafetyTrace.jsx                  # Stepping trace table with PlaybackControls & StepLog
│   │   │   ├── RequestPanel.jsx                 # Request simulation with step playback
│   │   │   ├── RagCanvas.jsx                    # Interactive SVG canvas with 3-color DFS highlights
│   │   │   ├── RagEditor.jsx                    # Graph editor toolbar and edge manager
│   │   │   ├── RagResult.jsx                    # Holt's Theorem analysis card
│   │   │   ├── RagDfsSimulator.jsx              # 3-color DFS cycle detection simulator card
│   │   │   └── RagEventSimulator.jsx            # Dynamic RAG event simulator card
│   │   └── memory/
│   │       ├── MemoryForm.jsx                   # Memory configuration panel
│   │       ├── MemoryBar.jsx                    # Memory bar visualizer using algorithm snapshots
│   │       ├── AllocationTable.jsx              # Placement results table
│   │       ├── MemoryStats.jsx                  # Fragmentation and utilization summary cards
│   │       ├── MemoryCompare.jsx                # Static benchmark comparison with Recharts
│   │       ├── MemoryExplanation.jsx            # Theory and trade-offs
│   │       ├── MemoryEventSimulator.jsx         # Dynamic event simulator (merge holes, compact)
│   │       └── MemorySideBySide.jsx             # Synchronized 3-algorithm comparison
│   ├── pages/
│   │   ├── SchedulingPage.jsx                   # CPU Scheduling simulator page
│   │   ├── DeadlockPage.jsx                     # Banker's & RAG simulator page
│   │   └── MemoryPage.jsx                       # Memory allocation simulator page
│   └── styles/                                  # Modular CSS design system
└── tests/
    ├── scheduling/                              # 11 test suites covering all scheduling features
    ├── deadlock/                                # 5 test suites (bankers, bankersSteps, rag, ragDfs, ragEvents)
    └── memory/                                  # 5 test suites (firstFit, bestFit, worstFit, stepScan, events)
```

---

## Verification & QA Status
- **Vitest Unit Tests**: 78 passed out of 78 tests across 21 test files.
- **ESLint 9**: Clean (0 errors, 0 warnings across all source and test files).
- **Vite Production Build**: Clean production bundle generated into `dist/`.
- **Pure Algorithm Isolation**: No React hooks or component state used inside `src/algorithms/`.
- **File Length Guideline**: Files maintained around ~150 lines or less with standard header documentation.

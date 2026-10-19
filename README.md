# OS Simulator Suite

An academic, production-grade Operating System algorithm simulation and visualization workbench built with **React 18 + Vite**, **React Router v6**, **Recharts**, and pure **CSS variables**. Designed for demonstrating, exploring, and benchmarking fundamental OS algorithms in CPU scheduling, deadlock avoidance/detection, and contiguous memory management.

---

## Key Modules & Features

### 1. CPU Scheduling Module
- **8 Pure Scheduling Algorithms**:
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF - Non-preemptive)
  - Shortest Remaining Time First (SRTF - Preemptive)
  - Round Robin (RR - Configurable quantum)
  - Priority Scheduling (Non-preemptive)
  - Priority Scheduling (Preemptive)
  - Highest Response Ratio Next (HRRN - Dynamic aging ratio)
  - Multilevel Feedback Queue (MLFQ - 3 priority tiers with demotion)
- **Idle Gap Handling**: Correctly models CPU idle slots when no processes are ready.
- **Context Switch Overhead**: Real-world switching cost calculations.
- **Timeline & Ready Queue Visualizer**: Second-by-second inspection of the running process, ready queue queueing, and completed jobs.
- **Starvation Detection**: Proactively flags processes waiting longer than $5 \times BT$.
- **Proportional Gantt Chart**: Scaled visual timeline with high-DPI PNG export.
- **Multi-Format Exports**: RFC 4180 CSV, printable audit PDF, and JSON scenario state saving/loading with schema validation.

### 2. Deadlock Module
- **Banker's Algorithm**:
  - Reactive Need Matrix computation ($Need = Max - Allocation$).
  - Step-by-step vector arithmetic trace of system safety.
  - Resource Request Evaluation (hypothetical grant test before real allocation).
- **Resource Allocation Graph (RAG)**:
  - Interactive SVG canvas with circular process nodes, rectangular resource boxes, and instance indicator dots.
  - Interactive edge toggling (Assignment $R \to P$ vs. Request $P \to R$).
  - Cycle detection using three-color Depth-First Search (DFS).
  - **Holt's Theorem Verification**: Distinguishes single-instance deadlocks (cycle $\iff$ deadlock) from multi-instance graphs (where reducible sink processes prevent deadlock even in the presence of cycles).

### 3. Memory Allocation Module
- **Contiguous Partitioning Strategies**:
  - First Fit (first block with sufficient capacity)
  - Best Fit (smallest block with sufficient capacity, tie-breaking by lower index)
  - Worst Fit (largest block with sufficient capacity, tie-breaking by lower index)
- **Partition Modes**:
  - **Dynamic Partitioning**: Blocks split to match process size; internal fragmentation is $0$ KB.
  - **Fixed Partitioning**: One process per block; leftover space counted as internal fragmentation.
- **Fragmentation Metrics**:
  - **Internal Fragmentation**: Unused memory inside allocated partitions.
  - **External Fragmentation**: Total free memory across separate holes that cannot satisfy an unallocated process.
- **Proportional Memory Bar**: Scaled partition rendering with colored process slices, hatched free space holes, and active candidate block outlines during step playback.
- **Cross-Algorithm Benchmarks**: Side-by-side comparison table and Recharts bar chart comparing memory utilization and fragmentation across all three strategies.

---

## Screenshots Placeholder

```
+-------------------------------------------------------------+
|                      [Gantt Chart UI]                       |
|  [P1: 0-4] [P2: 4-7] [IDLE: 7-8] [P3: 8-12]                 |
+-------------------------------------------------------------+
|                   [Banker's Safety Trace]                   |
|  P1 -> P3 -> P4 -> P0 -> P2  (System is in a SAFE state)    |
+-------------------------------------------------------------+
|                    [Memory Partition Bar]                   |
|  [B0: 100K (Free)] [B1: P1(212K) | 288K Free] [B2: 200K]   |
+-------------------------------------------------------------+
```
*(Add actual UI captures to `docs/screenshots/` during your demonstration).*

---

## Tech Stack

- **Core Framework**: React 18, Vite
- **Routing**: React Router v6
- **Styling**: Vanilla CSS with modern CSS Custom Properties (zero Tailwind / CSS-in-JS overhead)
- **Data Visualization**: Recharts (responsive bar and comparison charts), HTML5 SVG
- **Export Engines**: `html-to-image` (PNG capture), `jspdf` & `jspdf-autotable` (PDF reports)
- **Testing**: Vitest (60 passing tests across 16 test files)
- **Code Quality**: ESLint 9 (Flat Config), Prettier

---

## Folder Tree

```
os-simulator-suite/
├── docs/
│   ├── ARCHITECTURE.md          # System layers, result contracts, Mermaid diagram
│   └── PRESENTATION_GUIDE.md    # 10-minute demo script, file map, 12 viva Q&As
├── src/
│   ├── algorithms/
│   │   ├── scheduling/          # 8 pure CPU scheduling algorithms + registry
│   │   ├── deadlock/            # Banker's algorithm, RAG cycle detection
│   │   └── memory/              # First Fit, Best Fit, Worst Fit, shared utils
│   ├── components/
│   │   ├── common/              # Card, ErrorMessage, Header, ThemeToggle, ErrorBoundary
│   │   ├── scheduling/          # GanttChart, ReadyQueueView, PlaybackControls, Form
│   │   ├── deadlock/            # BankersForm, SafeSequenceView, RagCanvas, RequestPanel
│   │   └── memory/              # MemoryForm, MemoryBar, AllocationTable, MemoryStats, MemoryCompare
│   ├── data/                    # Academic presets for Scheduling, Deadlock, and Memory
│   ├── hooks/                   # usePlayback, useLocalStorage, useTheme
│   ├── pages/                   # SchedulingPage, DeadlockPage, MemoryPage
│   ├── styles/                  # Variables, base, layout, components, memory, deadlock
│   ├── utils/                   # CSV, PDF, PNG exporters, color generators, scenarios
│   ├── App.jsx                  # Root router with ErrorBoundary wrapping
│   └── main.jsx                 # React root mount
└── tests/
    ├── scheduling/              # 8 suites testing CPU scheduling correctness
    ├── deadlock/                # Banker's safety & RAG cycle tests
    └── memory/                  # First, Best, Worst Fit textbook tests
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Run Test Suite
```bash
npm test
```
Executes all 60 unit tests in Vitest verifying algorithms against standard textbook datasets (Galvin/Silberschatz).

### Linting & Code Standards
```bash
npm run lint
```
Checks for ESLint 9 rule compliance and enforces strict clean-code standards.

### Production Build
```bash
npm run build
```
Creates an optimized production bundle inside the `dist/` directory.

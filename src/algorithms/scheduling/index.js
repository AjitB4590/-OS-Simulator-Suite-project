/**
 * CPU Scheduling Algorithm Registry.
 * Central registration map allowing the UI and execution engine to dynamically
 * discover algorithms, required parameters (quantum, priority, mlfq), and educational metadata.
 */

import { simulateFCFS } from './fcfs.js';
import { simulateSJF } from './sjf.js';
import { simulateSRTF } from './srtf.js';
import { simulatePriorityNonPreemptive } from './priorityNonPreemptive.js';
import { simulatePriorityPreemptive } from './priorityPreemptive.js';
import { simulateRoundRobin } from './roundRobin.js';
import { simulateHRRN } from './hrrn.js';
import { simulateMLFQ } from './mlfq.js';

export { simulateFCFS, simulateSJF, simulateSRTF, simulatePriorityNonPreemptive, simulatePriorityPreemptive, simulateRoundRobin, simulateHRRN, simulateMLFQ };

export const SCHEDULING_ALGORITHMS = {
  fcfs: {
    id: 'fcfs', name: 'First Come First Serve (FCFS)', simulate: simulateFCFS,
    preemptive: false, needsQuantum: false, needsPriority: false, needsMlfqConfig: false,
    description: 'Executes processes strictly in order of arrival without preemption.',
    pros: ['Simple to implement', 'Fair in arrival order', 'Zero scheduling overhead'],
    cons: ['Convoy effect (short jobs wait behind long jobs)', 'Poor average waiting time'],
    bestUseCase: 'Batch systems where jobs have predictable, uniform execution times.',
    formulaNotes: 'Decision Key: Arrival Time (AT). Non-preemptive.',
  },
  sjf: {
    id: 'sjf', name: 'Shortest Job First (SJF)', simulate: simulateSJF,
    preemptive: false, needsQuantum: false, needsPriority: false, needsMlfqConfig: false,
    description: 'Selects the arrived process with minimal burst time. Runs to completion.',
    pros: ['Provably optimal minimum average waiting time for non-preemptive algorithms'],
    cons: ['Requires future burst time estimation', 'Can starve long jobs if short jobs keep arriving'],
    bestUseCase: 'Long-term job scheduling where runtimes are known or accurately estimated.',
    formulaNotes: 'Decision Key: Burst Time (BT). Non-preemptive.',
  },
  srtf: {
    id: 'srtf', name: 'Shortest Remaining Time First (SRTF)', simulate: simulateSRTF,
    preemptive: true, needsQuantum: false, needsPriority: false, needsMlfqConfig: false,
    description: 'Preemptive SJF: allocates CPU to the process with least remaining time.',
    pros: ['Optimal average turnaround time', 'High responsiveness for short processes'],
    cons: ['Higher context switch overhead', 'Severe starvation for long jobs under heavy load'],
    bestUseCase: 'Interactive environments with dynamic mixed-duration workloads.',
    formulaNotes: 'Decision Key: Remaining Burst Time (RBT). Preempts on shorter arrival.',
  },
  priority: {
    id: 'priority', name: 'Priority (Non-Preemptive)', simulate: simulatePriorityNonPreemptive,
    preemptive: false, needsQuantum: false, needsPriority: true, needsMlfqConfig: false,
    description: 'Allocates CPU to highest priority process (lowest number = highest urgency).',
    pros: ['Enforces critical system and mission-critical task preferences directly'],
    cons: ['Indefinite blocking / starvation of low-priority processes'],
    bestUseCase: 'Real-time and embedded systems where tasks have fixed criticality levels.',
    formulaNotes: 'Decision Key: Priority numerical value. Non-preemptive.',
  },
  priorityPreemptive: {
    id: 'priorityPreemptive', name: 'Priority (Preemptive)', simulate: simulatePriorityPreemptive,
    preemptive: true, needsQuantum: false, needsPriority: true, needsMlfqConfig: false,
    description: 'Preempts running tasks immediately if a higher priority process arrives.',
    pros: ['Immediate responsiveness for high-priority events and urgent interrupts'],
    cons: ['Frequent context switching', 'Lower-priority tasks can suffer indefinite starvation'],
    bestUseCase: 'Kernel dispatchers and hard real-time systems needing instant preemption.',
    formulaNotes: 'Decision Key: Priority. Preempts immediately when higher priority arrives.',
  },
  rr: {
    id: 'rr', name: 'Round Robin (RR)', simulate: simulateRoundRobin,
    preemptive: true, needsQuantum: true, needsPriority: false, needsMlfqConfig: false,
    description: 'Preemptively time-slices CPU execution evenly across ready processes.',
    pros: ['Starvation-free', 'Fair resource sharing', 'Excellent response times for all tasks'],
    cons: ['High context switch frequency if quantum is too small', 'Degrades to FCFS if quantum is huge'],
    bestUseCase: 'Time-sharing systems and interactive desktop environments.',
    formulaNotes: 'Quantum slice (TQ). Demoted to tail of queue after each quantum.',
  },
  hrrn: {
    id: 'hrrn', name: 'Highest Response Ratio Next (HRRN)', simulate: simulateHRRN,
    preemptive: false, needsQuantum: false, needsPriority: false, needsMlfqConfig: false,
    description: 'Balances burst time with waiting time: Ratio = (Waiting + Burst) / Burst.',
    pros: ['Prevents starvation (waiting increases priority)', 'Favors shorter jobs naturally'],
    cons: ['Non-preemptive', 'Requires knowing or estimating burst times'],
    bestUseCase: 'Mixed batch workloads where starvation must be mathematically prevented.',
    formulaNotes: 'Ratio R = (W + S) / S = 1 + W / S. Non-preemptive.',
  },
  mlfq: {
    id: 'mlfq', name: 'Multilevel Feedback Queue (MLFQ)', simulate: simulateMLFQ,
    preemptive: true, needsQuantum: false, needsPriority: false, needsMlfqConfig: true,
    description: 'Multi-queue priority system with escalating quanta and automatic demotion.',
    pros: ['Adaptive learning: separates I/O-bound interactive from CPU-bound batch tasks without prior knowledge'],
    cons: ['Complex configuration (queues, quanta, aging)', 'Gaming the scheduler vulnerability'],
    bestUseCase: 'Modern general-purpose OS kernels (BSD, Windows NT scheduler, macOS).',
    formulaNotes: 'Top queue Q0 -> Q1 -> ... -> Qk (FCFS). Demoted on quantum exhaustion.',
  },
};

export const ALGORITHM_OPTIONS = Object.values(SCHEDULING_ALGORITHMS);

export function getAlgorithm(id) {
  return SCHEDULING_ALGORITHMS[id] || SCHEDULING_ALGORITHMS.fcfs;
}

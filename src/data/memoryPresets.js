/**
 * Educational Memory Presets for Contiguous Allocation Visualizations.
 * Includes classic textbook datasets demonstrating algorithm divergence and fragmentation.
 */

export const MEMORY_PRESETS = [
  {
    id: 'textbook',
    name: 'Textbook Example (Galvin / Silberschatz)',
    description: 'Classic benchmark: Best Fit allocates all processes, while First Fit and Worst Fit leave P4 unallocated.',
    blockSizes: [100, 500, 200, 300, 600],
    processes: [
      { pid: 'P1', size: 212 },
      { pid: 'P2', size: 417 },
      { pid: 'P3', size: 112 },
      { pid: 'P4', size: 426 },
    ],
    processSizes: [
      { pid: 'P1', size: 212 },
      { pid: 'P2', size: 417 },
      { pid: 'P3', size: 112 },
      { pid: 'P4', size: 426 },
    ],
  },
  {
    id: 'fragmentation_demo',
    name: 'Severe Fragmentation Demo',
    description: 'Demonstrates internal fragmentation in fixed mode and external fragmentation when holes cannot fit waiting processes.',
    blockSizes: [200, 200, 200, 200],
    processes: [
      { pid: 'P1', size: 180 },
      { pid: 'P2', size: 180 },
      { pid: 'P3', size: 180 },
      { pid: 'P4', size: 70 },
    ],
    processSizes: [
      { pid: 'P1', size: 180 },
      { pid: 'P2', size: 180 },
      { pid: 'P3', size: 180 },
      { pid: 'P4', size: 70 },
    ],
  },
  {
    id: 'power_of_two',
    name: 'Power-of-Two Partitions (256 KB)',
    description: 'Uniform equal-sized memory blocks typical of simple fixed-partition OS setups.',
    blockSizes: [256, 256, 256, 256],
    processes: [
      { pid: 'P1', size: 128 },
      { pid: 'P2', size: 200 },
      { pid: 'P3', size: 64 },
      { pid: 'P4', size: 256 },
    ],
    processSizes: [
      { pid: 'P1', size: 128 },
      { pid: 'P2', size: 200 },
      { pid: 'P3', size: 64 },
      { pid: 'P4', size: 256 },
    ],
  },
];

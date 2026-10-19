import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateScenario,
  serializeScenario,
  deserializeScenario,
  getSavedScenarios,
  saveScenario,
  renameScenario,
  deleteScenario,
} from '../../src/utils/scenarios.js';

describe('Scenario Serialization & Validation', () => {
  const sampleData = {
    version: '1.0',
    algorithmId: 'rr',
    quantum: 2,
    contextSwitchOverhead: 1,
    processes: [
      { pid: 'P1', at: 0, bt: 4, priority: 1 },
      { pid: 'P2', at: 1, bt: 3, priority: 2 },
    ],
  };

  it('validates a correct scenario successfully', () => {
    const res = validateScenario(sampleData);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('flags missing version and missing processes', () => {
    const res = validateScenario({});
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('version'))).toBe(true);
    expect(res.errors.some((e) => e.includes('processes'))).toBe(true);
  });

  it('flags invalid process numerical constraints (negative AT, zero BT, non-integer)', () => {
    const invalid = {
      version: '1.0',
      processes: [
        { pid: 'P1', at: -1, bt: 0 },
        { pid: 'P2', at: 1.5, bt: 4 },
      ],
    };
    const res = validateScenario(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('serializes and deserializes cleanly without data loss', () => {
    const jsonStr = serializeScenario(sampleData);
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('"version": "1.0"');

    const result = deserializeScenario(jsonStr);
    expect(result.success).toBe(true);
    expect(result.data.processes).toHaveLength(2);
    expect(result.data.quantum).toBe(2);
  });

  it('safely handles malformed JSON without crashing', () => {
    const result = deserializeScenario('INVALID_JSON_CONTENT{{{');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('JSON parse error');
  });
});

describe('Scenario LocalStorage Operations', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    globalThis.localStorage = {
      getItem: (key) => mockStore[key] || null,
      setItem: (key, val) => {
        mockStore[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  it('saves, renames, and deletes scenarios', () => {
    expect(getSavedScenarios()).toHaveLength(0);

    const saved = saveScenario('Test Workload', {
      algorithmId: 'fcfs',
      processes: [{ pid: 'P1', at: 0, bt: 2 }],
    });
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Test Workload');

    const renamed = renameScenario(saved[0].id, 'Renamed Workload');
    expect(renamed[0].name).toBe('Renamed Workload');

    const deleted = deleteScenario(saved[0].id);
    expect(deleted).toHaveLength(0);
  });
});

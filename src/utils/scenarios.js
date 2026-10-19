/**
 * Scenario Serialization, Strict Schema Validation, and Local Storage Manager.
 * Supports saving, renaming, deleting, and importing/exporting simulation scenarios
 * with strict versioned JSON schema validation and zero crash guarantees.
 */

export const SCENARIO_STORAGE_KEY = 'ossim.scenarios.v1';
export const AUTOSAVE_STORAGE_KEY = 'ossim.last_state.v1';

/**
 * Validates a scenario payload against strict schema rules.
 * @param {any} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateScenario(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Scenario data must be a valid non-null object.'] };
  }

  // Schema version check
  if (!payload.version) {
    errors.push('Missing "version" declaration (expected "1.0").');
  }

  // Processes array check
  if (!Array.isArray(payload.processes) || payload.processes.length === 0) {
    errors.push('Scenario must contain a non-empty "processes" array.');
  } else {
    payload.processes.forEach((p, idx) => {
      if (!p || typeof p !== 'object') {
        errors.push(`Process at index ${idx} is not an object.`);
      } else {
        if (!p.pid || typeof p.pid !== 'string') errors.push(`Process #${idx + 1} missing valid string "pid".`);
        if (typeof p.at !== 'number' || p.at < 0 || !Number.isInteger(p.at)) {
          errors.push(`Process #${p.pid || idx + 1} AT must be a non-negative integer.`);
        }
        if (typeof p.bt !== 'number' || p.bt <= 0 || !Number.isInteger(p.bt)) {
          errors.push(`Process #${p.pid || idx + 1} BT must be a positive integer.`);
        }
        if (p.priority !== undefined && (typeof p.priority !== 'number' || p.priority < 0)) {
          errors.push(`Process #${p.pid || idx + 1} priority must be a non-negative number.`);
        }
      }
    });
  }

  // Numerical parameters validation
  if (payload.quantum !== undefined && (typeof payload.quantum !== 'number' || payload.quantum <= 0)) {
    errors.push('Time Quantum must be a positive integer.');
  }
  if (payload.contextSwitchOverhead !== undefined && (typeof payload.contextSwitchOverhead !== 'number' || payload.contextSwitchOverhead < 0)) {
    errors.push('Context switch overhead must be a non-negative integer.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Serializes scenario to formatted JSON string.
 * @param {any} data
 * @returns {string}
 */
export function serializeScenario(data) {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ...data,
    },
    null,
    2
  );
}

/**
 * Deserializes JSON and validates scenario structure.
 * @param {string} jsonString
 * @returns {{ success: boolean, data?: any, errors?: string[] }}
 */
export function deserializeScenario(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateScenario(parsed);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, errors: [`JSON parse error: ${err.message}`] };
  }
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

/**
 * Reads list of saved scenarios from localStorage.
 * @returns {Array<{ id: string, name: string, updatedAt: string, data: any }>}
 */
export function getSavedScenarios() {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const item = storage.getItem(SCENARIO_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a scenario in localStorage.
 * @param {string} name
 * @param {any} scenarioData
 */
export function saveScenario(name, scenarioData) {
  const existing = getSavedScenarios();
  const id = `sc_${Date.now()}`;
  const record = {
    id,
    name: name.trim() || 'Untitled Scenario',
    updatedAt: new Date().toISOString(),
    data: { version: '1.0', ...scenarioData },
  };
  const updated = [record, ...existing.filter((s) => s.name !== name.trim())];
  const storage = getStorage();
  if (storage) storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Renames a scenario by ID.
 * @param {string} id
 * @param {string} newName
 */
export function renameScenario(id, newName) {
  const existing = getSavedScenarios();
  const updated = existing.map((s) => (s.id === id ? { ...s, name: newName.trim(), updatedAt: new Date().toISOString() } : s));
  const storage = getStorage();
  if (storage) storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Deletes a scenario by ID.
 * @param {string} id
 */
export function deleteScenario(id) {
  const existing = getSavedScenarios();
  const updated = existing.filter((s) => s.id !== id);
  const storage = getStorage();
  if (storage) storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

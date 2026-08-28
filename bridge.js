'use strict';

(() => {
  const nativeSaveState = saveState;
  const nativeSaveSettings = saveSettings;
  const nativeCustodyFor = custodyFor;
  let applyingRemoteState = false;

  const clone = value => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };

  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const falseActivityPattern = /\bjud[ôo]\b|kimono/i;

  function normalizeTasks(tasks) {
    let changed = false;
    const normalized = [];

    for (const originalTask of Array.isArray(tasks) ? tasks : []) {
      const title = String(originalTask?.title || '');
      const details = String(originalTask?.details || '');

      if (falseActivityPattern.test(`${title} ${details}`)) {
        changed = true;
        continue;
      }

      let task = { ...originalTask };
      if (task.owner === 'Pai') {
        task.owner = 'Fábio';
        changed = true;
      }

      const isFbFamily = /fb\s*&\s*fam[ií]lia/i.test(title)
        && /dia dos pais/i.test(details);
      if (isFbFamily && task.date !== '2026-08-29') {
        task = {
          ...task,
          date: '2026-08-29',
          time: task.time || '09:40'
        };
        changed = true;
      }

      normalized.push(task);
    }

    return { tasks: normalized, changed };
  }

  const fatherProfile = FAMILY.find(person => person.name === 'Pai');
  if (fatherProfile) {
    fatherProfile.name = 'Fábio';
    fatherProfile.initial = 'F';
    fatherProfile.role = 'Pai';
  }

  const initialMigration = normalizeTasks(state.tasks);
  const migratedProfile = state.activeProfile === 'Pai' ? 'Fábio' : state.activeProfile;
  if (initialMigration.changed || migratedProfile !== state.activeProfile) {
    state = {
      ...state,
      activeProfile: migratedProfile,
      tasks: initialMigration.tasks
    };
    nativeSaveState();
  }

  saveState = function saveStateWithCloudSignal() {
    nativeSaveState();
    if (!applyingRemoteState) emit('agenda:state-changed', { state: clone(state) });
  };

  saveSettings = function saveSettingsWithCloudSignal() {
    nativeSaveSettings();
    emit('agenda:settings-changed', { settings: clone(settings) });
  };

  custodyFor = function custodyFromCalendar(date) {
    const iso = toISO(date);
    const calendarText = state.tasks
      .filter(task => task.date === iso && task.source === 'Google Calendar')
      .map(task => `${task.title} ${task.details || ''}`)
      .join(' ');

    if (/\bf[aá]bio\b|casa do pai|com o pai|dormir.*pai|pai.*fim de semana/i.test(calendarText)) return 'Casa do Fábio';
    if (/\brachel\b|casa da m[aã]e|com a m[aã]e|dormir.*m[aã]e/i.test(calendarText)) return 'Casa da mãe';

    const fallback = nativeCustodyFor(date);
    return fallback === 'Casa do pai' ? 'Casa do Fábio' : fallback;
  };

  window.AgendaThomaz = {
    version: '2.2.0',
    getState: () => clone(state),
    getSettings: () => clone(settings),

    applyCloudTasks(tasks) {
      const normalized = normalizeTasks(tasks);
      applyingRemoteState = true;
      state = { ...state, tasks: normalized.tasks.map(task => ({ ...task })) };
      nativeSaveState();
      renderAll();
      applyingRemoteState = false;
      if (normalized.changed) emit('agenda:state-changed', { state: clone(state) });
    },

    mergeCalendarEvents(calendarTasks) {
      const incoming = normalizeTasks(calendarTasks).tasks;
      const existingById = new Map(state.tasks.map(task => [task.id, task]));
      const localTasks = normalizeTasks(state.tasks.filter(task => task.source !== 'Google Calendar')).tasks;
      const merged = incoming.map(task => {
        const previous = existingById.get(task.id);
        return {
          ...task,
          completed: previous?.completed || false,
          completedAt: previous?.completedAt || null,
          help: previous?.help || false
        };
      });
      state.tasks = [...localTasks, ...merged];
      saveState();
      renderAll();
    },

    patchTask(taskId, patch) {
      const task = state.tasks.find(item => item.id === taskId);
      if (!task) return false;
      const normalizedPatch = patch?.owner === 'Pai' ? { ...patch, owner: 'Fábio' } : patch;
      Object.assign(task, normalizedPatch);
      saveState();
      renderAll();
      return true;
    },

    showToast,
    openInfo,
    switchView,
    renderAll,
    toISO,
    localDate
  };

  emit('agenda:bridge-ready', { version: window.AgendaThomaz.version });
})();
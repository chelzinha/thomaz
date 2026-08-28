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

    if (/\bf[aá]bio\b|casa do pai|com o pai|dormir.*pai|pai.*fim de semana/i.test(calendarText)) return 'Casa do pai';
    if (/\brachel\b|casa da m[aã]e|com a m[aã]e|dormir.*m[aã]e/i.test(calendarText)) return 'Casa da mãe';
    return nativeCustodyFor(date);
  };

  window.AgendaThomaz = {
    version: '2.0.0',
    getState: () => clone(state),
    getSettings: () => clone(settings),

    applyCloudTasks(tasks) {
      applyingRemoteState = true;
      state = { ...state, tasks: Array.isArray(tasks) ? tasks.map(task => ({ ...task })) : [] };
      nativeSaveState();
      renderAll();
      applyingRemoteState = false;
    },

    mergeCalendarEvents(calendarTasks) {
      const incoming = Array.isArray(calendarTasks) ? calendarTasks : [];
      const existingById = new Map(state.tasks.map(task => [task.id, task]));
      const localTasks = state.tasks.filter(task => task.source !== 'Google Calendar');
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
      Object.assign(task, patch);
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
'use strict';

const STORAGE_KEY = 'agenda-thomaz-v1';
const SETTINGS_KEY = 'agenda-thomaz-settings-v1';
const NOTIFIED_KEY = 'agenda-thomaz-notified-v1';

const TYPE_META = {
  school: { label: 'Tarefa escolar', icon: '📚' },
  prepare: { label: 'Preparar', icon: '🎒' },
  test: { label: 'Prova', icon: '🧠' },
  extra: { label: 'Extracurricular', icon: '🥋' },
  family: { label: 'Família', icon: '🏠' }
};

const FAMILY = [
  { name: 'Thomaz', initial: 'T', color: '#6658d3', role: 'Estudante', active: true },
  { name: 'Rachel', initial: 'R', color: '#ef6c79', role: 'Mãe' },
  { name: 'Pai', initial: 'P', color: '#3f8cff', role: 'Pai' },
  { name: 'Dora', initial: 'D', color: '#d965ae', role: 'Irmã' },
  { name: 'Família', initial: 'F', color: '#33b77b', role: 'Todos' }
];

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function localDate(daysFromToday = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date;
}

function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromISO(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function daysUntil(dateValue) {
  const today = fromISO(toISO(localDate()));
  const target = fromISO(dateValue);
  return Math.ceil((target - today) / 86400000);
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function seedTasks() {
  return [
    {
      id: crypto.randomUUID(),
      title: 'Revisar a atividade de Inglês',
      details: 'Unidade 1: o que podemos aprender com o passado?',
      type: 'school',
      date: toISO(localDate()),
      time: '16:00',
      owner: 'Thomaz',
      adult: false,
      completed: false,
      help: false,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Separar blusa laranja pastel',
      details: 'Roupa para a homenagem do Dia dos Pais na escola.',
      type: 'prepare',
      date: toISO(localDate()),
      time: '20:00',
      owner: 'Rachel',
      adult: true,
      completed: false,
      help: false,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Assistir ao vídeo de Ciências',
      details: 'Vídeo sugerido sobre estados da matéria.',
      type: 'school',
      date: toISO(localDate()),
      time: '17:00',
      owner: 'Thomaz',
      adult: false,
      completed: false,
      help: false,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Treino de judô',
      details: 'Levar kimono e garrafa de água.',
      type: 'extra',
      date: toISO(localDate()),
      time: '18:30',
      owner: 'Thomaz',
      adult: true,
      completed: false,
      help: false,
      source: 'Família'
    },
    {
      id: crypto.randomUUID(),
      title: 'Projeto FB & Família',
      details: 'Evento em homenagem ao Dia dos Pais.',
      type: 'family',
      date: toISO(localDate(2)),
      time: '09:40',
      owner: 'Família',
      adult: true,
      completed: false,
      help: false,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Verificação de Matemática',
      details: 'Revisar operações e problemas da unidade atual.',
      type: 'test',
      date: toISO(localDate(4)),
      time: '08:00',
      owner: 'Thomaz',
      adult: false,
      completed: false,
      help: false,
      studyProgress: 25,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Avaliação de Ciências',
      details: 'Estados da matéria e transformações.',
      type: 'test',
      date: toISO(localDate(7)),
      time: '08:00',
      owner: 'Thomaz',
      adult: false,
      completed: false,
      help: false,
      studyProgress: 10,
      source: 'Agenda Edu'
    },
    {
      id: crypto.randomUUID(),
      title: 'Levar livro de leitura',
      details: 'Colocar na mochila na noite anterior.',
      type: 'prepare',
      date: toISO(localDate(1)),
      time: '20:00',
      owner: 'Rachel',
      adult: true,
      completed: false,
      help: false,
      source: 'Família'
    }
  ];
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.tasks?.length) return saved;
  } catch (error) {
    console.warn('Não foi possível ler os dados salvos.', error);
  }
  return { tasks: seedTasks(), activeProfile: 'Thomaz', filter: 'all' };
}

function loadSettings() {
  try {
    return { focusMode: false, reduceStimuli: false, sound: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { focusMode: false, reduceStimuli: false, sound: true };
  }
}

let state = loadState();
let settings = loadSettings();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function iconForOwner(owner) {
  return FAMILY.find(person => person.name === owner)?.initial || '•';
}

function ownerColor(owner) {
  return FAMILY.find(person => person.name === owner)?.color || '#74778d';
}

function playDoneSound() {
  if (!settings.sound) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.setValueAtTime(620, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(840, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
  } catch {
    // O som é opcional.
  }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function renderFamilyAvatars() {
  $('#familyAvatars').innerHTML = FAMILY.map(person => `
    <button class="avatar-button ${state.activeProfile === person.name ? 'active' : ''}"
      data-profile="${escapeHTML(person.name)}"
      title="${escapeHTML(person.name)} - ${escapeHTML(person.role)}"
      style="background:${person.color}">
      ${escapeHTML(person.initial)}
    </button>
  `).join('');

  $$('.avatar-button').forEach(button => {
    button.addEventListener('click', () => {
      state.activeProfile = button.dataset.profile;
      saveState();
      renderFamilyAvatars();
      showToast(`Visualizando como ${state.activeProfile}`);
    });
  });
}

function taskCard(task, focus = false) {
  const meta = TYPE_META[task.type] || TYPE_META.school;
  return `
    <article class="task-card ${task.completed ? 'completed' : ''} ${focus ? 'focus-task' : ''}" data-task-id="${task.id}" data-type="${task.type}">
      <button class="task-check" data-action="toggle" aria-label="${task.completed ? 'Desmarcar' : 'Concluir'} ${escapeHTML(task.title)}">✓</button>
      <div class="task-main">
        <div class="task-label"><span>${meta.icon}</span>${meta.label}${task.adult ? '<span>• adulto</span>' : ''}</div>
        <div class="task-title">${escapeHTML(task.title)}</div>
        <p class="task-details">${escapeHTML(task.details || 'Sem detalhes adicionais')}</p>
      </div>
      <div class="task-side">
        <span class="task-time">${escapeHTML(task.time || 'Sem horário')}</span>
        <span class="owner-tag" style="color:${ownerColor(task.owner)}">${iconForOwner(task.owner)} ${escapeHTML(task.owner)}</span>
        ${task.owner === 'Thomaz' && !task.completed ? `<button class="help-button" data-action="help">${task.help ? '🆘 Ajuda solicitada' : 'Preciso de ajuda'}</button>` : ''}
      </div>
    </article>
  `;
}

function getTodayTasks() {
  return state.tasks
    .filter(task => task.date === toISO(localDate()))
    .filter(task => state.filter === 'all' || task.type === state.filter)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.time || '').localeCompare(b.time || ''));
}

function renderToday() {
  const tasks = getTodayTasks();
  const firstOpen = tasks.find(task => !task.completed);
  $('#todayTaskList').innerHTML = tasks.length
    ? tasks.map(task => taskCard(task, task.id === firstOpen?.id)).join('')
    : '<div class="empty-state"><strong>Dia livre por aqui</strong>Nenhuma atividade neste filtro.</div>';

  const allToday = state.tasks.filter(task => task.date === toISO(localDate()));
  const completed = allToday.filter(task => task.completed).length;
  $('#todayProgressText').textContent = `${completed} de ${allToday.length} concluídas`;

  $('#focusTitle').textContent = firstOpen?.title || 'Missão do dia concluída!';
  $('#focusDescription').textContent = firstOpen?.details || 'Agora é hora de descansar e aproveitar o restante do dia.';
  $('#focusActionButton').textContent = firstOpen ? 'Começar agora' : 'Tudo feito ✓';
  $('#focusActionButton').disabled = !firstOpen;
  $('#focusActionButton').dataset.taskId = firstOpen?.id || '';

  bindTaskActions($('#todayTaskList'));
  renderAttention();
  renderProgress();
}

function bindTaskActions(root) {
  $$('[data-task-id]', root).forEach(card => {
    const taskId = card.dataset.taskId;
    $('[data-action="toggle"]', card)?.addEventListener('click', () => toggleTask(taskId));
    $('[data-action="help"]', card)?.addEventListener('click', () => toggleHelp(taskId));
  });
}

function toggleTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  saveState();
  if (task.completed) {
    playDoneSound();
    showToast('Muito bem! Mais uma missão concluída.');
  }
  renderAll();
}

function toggleHelp(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  task.help = !task.help;
  saveState();
  showToast(task.help ? 'Pedido de ajuda marcado para a família.' : 'Pedido de ajuda retirado.');
  renderAll();
}

function renderAttention() {
  const limit = toISO(localDate(7));
  const attention = state.tasks
    .filter(task => task.adult && !task.completed && task.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  $('#attentionGrid').innerHTML = attention.length ? attention.map(task => {
    const due = daysUntil(task.date);
    const dueText = due <= 0 ? 'Precisa ser feito hoje' : due === 1 ? 'Preparar até amanhã' : `Preparar em ${due} dias`;
    return `
      <article class="attention-card">
        <div class="attention-icon">${TYPE_META[task.type]?.icon || '📌'}</div>
        <h3>${escapeHTML(task.title)}</h3>
        <p>${escapeHTML(task.details)}</p>
        <button class="attention-action" data-complete-attention="${task.id}">${dueText}</button>
      </article>
    `;
  }).join('') : '<div class="empty-state"><strong>Nada pendente para os adultos</strong>Os preparativos estão em dia.</div>';

  $$('[data-complete-attention]').forEach(button => button.addEventListener('click', () => toggleTask(button.dataset.completeAttention)));
}

function renderProgress() {
  const start = toISO(localDate(-6));
  const end = toISO(localDate());
  const weekTasks = state.tasks.filter(task => task.date >= start && task.date <= end);
  const completed = weekTasks.filter(task => task.completed).length;
  const percentage = weekTasks.length ? Math.round((completed / weekTasks.length) * 100) : 0;
  $('#weeklyProgress').textContent = `${percentage}%`;
  $('#weeklyRing').style.setProperty('--progress', `${percentage * 3.6}deg`);
}

function renderCountdown() {
  const next = state.tasks
    .filter(task => task.type === 'test' && !task.completed && daysUntil(task.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
    || state.tasks.filter(task => !task.completed && daysUntil(task.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!next) {
    $('#countdownNumber').textContent = '✓';
    $('#countdownUnit').textContent = 'em dia';
    $('#countdownTitle').textContent = 'Sem prazos próximos';
    $('#countdownMeta').textContent = 'Aproveite a tranquilidade';
    return;
  }

  const days = daysUntil(next.date);
  $('#countdownIcon').textContent = TYPE_META[next.type]?.icon || '⏳';
  $('#countdownNumber').textContent = Math.max(0, days);
  $('#countdownUnit').textContent = days === 1 ? 'dia' : days === 0 ? 'hoje' : 'dias';
  $('#countdownTitle').textContent = next.title;
  $('#countdownMeta').textContent = next.details;
}

function renderWeek() {
  const days = Array.from({ length: 5 }, (_, index) => localDate(index));
  $('#weekBoard').innerHTML = days.map(date => {
    const iso = toISO(date);
    const dayTasks = state.tasks.filter(task => task.date === iso).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return `
      <article class="day-column ${indexIsToday(date) ? 'today' : ''}">
        <div class="day-header"><strong>${capitalize(SHORT_DATE_FORMATTER.format(date))}</strong><span>${date.getDate()}</span></div>
        <div class="day-items">
          ${dayTasks.length ? dayTasks.map(task => `
            <div class="mini-task">
              <strong><span class="mini-icon">${TYPE_META[task.type]?.icon || '📌'}</span>${escapeHTML(task.title)}</strong>
              <small>${escapeHTML(task.time || 'Sem horário')} • ${escapeHTML(task.owner)}</small>
            </div>
          `).join('') : '<div class="empty-state">Livre</div>'}
        </div>
      </article>
    `;
  }).join('');
}

function indexIsToday(date) {
  return toISO(date) === toISO(localDate());
}

function renderTests() {
  const tests = state.tasks.filter(task => task.type === 'test' && daysUntil(task.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  $('#testGrid').innerHTML = tests.length ? tests.map(task => {
    const days = daysUntil(task.date);
    const progress = task.studyProgress || (task.completed ? 100 : 0);
    return `
      <article class="test-card">
        <div class="test-card-top">
          <div class="test-subject"><span>🧠</span><span>${escapeHTML(task.title)}</span></div>
          <div class="test-days">${days}</div>
        </div>
        <h3>${days === 0 ? 'É hoje' : days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`}</h3>
        <p>${escapeHTML(task.details)}</p>
        <div class="study-progress"><span style="width:${Math.min(100, progress)}%"></span></div>
        <footer><span>Preparação</span><span>${progress}%</span></footer>
      </article>
    `;
  }).join('') : '<div class="empty-state"><strong>Nenhuma prova próxima</strong>Quando uma avaliação chegar, ela aparece aqui.</div>';
}

function custodyFor(date) {
  const day = date.getDay();
  return day === 5 || day === 6 ? 'Casa do pai' : 'Casa da mãe';
}

function renderFamilyCalendar() {
  const days = Array.from({ length: 7 }, (_, index) => localDate(index));
  $('#custodyText').textContent = custodyFor(localDate());
  $('#familyCalendar').innerHTML = days.map(date => {
    const iso = toISO(date);
    const tasks = state.tasks.filter(task => task.date === iso).slice(0, 3);
    const events = [`${custodyFor(date)}`].concat(tasks.map(task => task.title));
    return `
      <div class="calendar-day">
        <div class="calendar-date"><strong>${date.getDate()}</strong><small>${MONTH_FORMATTER.format(date)}</small></div>
        <div class="calendar-events">
          ${events.map((event, index) => `<div class="calendar-event"><span class="event-dot" style="background:${index === 0 ? '#33b77b' : '#6658d3'}"></span>${escapeHTML(event)}</div>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderResponsibilities() {
  const openTasks = state.tasks.filter(task => !task.completed);
  $('#responsibilityList').innerHTML = FAMILY.filter(person => person.name !== 'Thomaz').map(person => {
    const tasks = openTasks.filter(task => task.owner === person.name);
    const next = tasks.sort((a, b) => a.date.localeCompare(b.date))[0];
    return `
      <div class="responsibility-item">
        <span class="responsibility-avatar" style="background:${person.color}">${person.initial}</span>
        <div><strong>${escapeHTML(person.name)} • ${tasks.length} pendência${tasks.length === 1 ? '' : 's'}</strong><small>${next ? escapeHTML(next.title) : 'Tudo em dia'}</small></div>
      </div>
    `;
  }).join('');
}

function renderSettings() {
  $('#focusModeToggle').checked = settings.focusMode;
  $('#reduceStimuliToggle').checked = settings.reduceStimuli;
  $('#soundToggle').checked = settings.sound;
  document.body.classList.toggle('focus-mode', settings.focusMode);
  document.body.classList.toggle('reduce-stimuli', settings.reduceStimuli);
}

function renderAll() {
  renderFamilyAvatars();
  renderToday();
  renderCountdown();
  renderWeek();
  renderTests();
  renderFamilyCalendar();
  renderResponsibilities();
  renderSettings();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace('.', '');
}

function switchView(viewName) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `view-${viewName}`));
  $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));

  const labels = {
    today: ['Hoje', 'Bom dia, família!', 'Vamos enxergar somente o próximo passo.'],
    week: ['Planejamento', 'Nossa semana', 'Antecipar reduz a correria e os esquecimentos.'],
    tests: ['Estudos', 'Provas e avaliações', 'Um pouco por dia funciona melhor do que tudo de uma vez.'],
    family: ['Organização', 'Agenda da família', 'Todos conseguem ver onde o Thomaz estará e o que precisa acontecer.'],
    settings: ['Preferências', 'Ajustes da agenda', 'Adapte a tela ao nível de estímulo ideal para vocês.']
  };
  const [eyebrow, title, subtitle] = labels[viewName] || labels.today;
  $('#todayLabel').textContent = eyebrow;
  $('#pageTitle').textContent = title;
  $('#pageSubtitle').textContent = subtitle;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openInfo(title, content) {
  $('#infoDialogTitle').textContent = title;
  $('#infoDialogContent').innerHTML = content;
  $('#infoDialog').showModal();
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    openInfo('Lembretes no celular', '<p>Este navegador não oferece notificações. No iPhone, instale o aplicativo na Tela de Início e use a versão mais recente do iOS.</p>');
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification('Agenda do Thomaz', {
        body: 'Lembretes ativados neste aparelho. A próxima etapa será conectar os avisos ao Google Calendar.',
        icon: 'icons/app-icon.svg',
        badge: 'icons/app-icon.svg'
      });
    } else {
      new Notification('Agenda do Thomaz', { body: 'Lembretes ativados neste aparelho.' });
    }
    showToast('Lembretes permitidos neste aparelho.');
    checkAdultReminders();
  } else {
    showToast('As notificações não foram autorizadas.');
  }
}

async function checkAdultReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = toISO(localDate());
  if (localStorage.getItem(NOTIFIED_KEY) === today) return;
  const reminders = state.tasks.filter(task => task.adult && !task.completed && task.date === today);
  if (!reminders.length) return;
  const registration = await navigator.serviceWorker?.ready;
  const body = reminders.length === 1 ? reminders[0].title : `${reminders.length} preparativos precisam de atenção hoje.`;
  if (registration) await registration.showNotification('Preparativo do Thomaz', { body, icon: 'icons/app-icon.svg' });
  localStorage.setItem(NOTIFIED_KEY, today);
}

function setupEvents() {
  $$('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));

  $('#todayFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    saveState();
    $$('#todayFilters .chip').forEach(chip => chip.classList.toggle('active', chip === button));
    renderToday();
  });

  $('#addTaskButton').addEventListener('click', () => {
    $('#taskDateInput').value = toISO(localDate());
    $('#taskDialog').showModal();
    window.setTimeout(() => $('#taskTitleInput').focus(), 50);
  });

  $('#taskForm').addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const title = $('#taskTitleInput').value.trim();
    if (!title) return;
    state.tasks.push({
      id: crypto.randomUUID(),
      title,
      details: $('#taskDetailsInput').value.trim(),
      type: $('#taskTypeInput').value,
      date: $('#taskDateInput').value,
      time: $('#taskTimeInput').value,
      owner: $('#taskOwnerInput').value,
      adult: $('#taskAdultInput').checked,
      completed: false,
      help: false,
      source: 'Manual'
    });
    saveState();
    event.currentTarget.reset();
    $('#taskDialog').close();
    showToast('Atividade adicionada à agenda.');
    renderAll();
  });

  $('#focusActionButton').addEventListener('click', event => {
    const card = document.querySelector(`[data-task-id="${event.currentTarget.dataset.taskId}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], { duration: 420 });
  });

  $('#notificationButton').addEventListener('click', enableNotifications);
  $('#openCalendarButton').addEventListener('click', () => switchView('family'));
  $('#syncCalendarButton').addEventListener('click', () => openIntegration('calendar'));
  $('#googleLoginButton').addEventListener('click', () => openIntegration('google'));

  $('#focusModeToggle').addEventListener('change', event => { settings.focusMode = event.target.checked; saveSettings(); renderSettings(); renderToday(); });
  $('#reduceStimuliToggle').addEventListener('change', event => { settings.reduceStimuli = event.target.checked; saveSettings(); renderSettings(); });
  $('#soundToggle').addEventListener('change', event => { settings.sound = event.target.checked; saveSettings(); });

  $$('[data-integration]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.integration === 'notifications') enableNotifications();
    else openIntegration(button.dataset.integration);
  }));

  $('#closeInfoDialog').addEventListener('click', () => $('#infoDialog').close());
  $('#infoDialogOk').addEventListener('click', () => $('#infoDialog').close());
}

function openIntegration(name) {
  const content = {
    google: {
      title: 'Login com Google',
      body: '<p>A tela já está preparada. Para ativar o login real, será necessário conectar um projeto Firebase e cadastrar o domínio do Netlify.</p><ul><li>Somente familiares autorizados terão acesso.</li><li>Cada pessoa poderá usar seu próprio avatar.</li><li>Os dados serão sincronizados entre celulares.</li></ul>'
    },
    calendar: {
      title: 'Google Calendar da família',
      body: '<p>A integração usará o calendário familiar para mostrar compromissos e os dias em que o Thomaz dorme na casa do pai.</p><ul><li>Eventos poderão gerar lembretes no celular.</li><li>A agenda visual continuará simples.</li><li>Somente os dados necessários serão exibidos.</li></ul>'
    },
    agendaedu: {
      title: 'Importação da Agenda Edu',
      body: '<p>O próximo módulo lerá no Gmail as mensagens relacionadas ao Thomaz, eliminará duplicidades e converterá o conteúdo em tarefas, provas, materiais e eventos.</p>'
    }
  }[name];
  if (content) openInfo(content.title, content.body);
}

function updateHeaderDate() {
  $('#todayLabel').textContent = capitalize(DATE_FORMATTER.format(localDate()));
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
    } catch (error) {
      console.warn('Service worker não registrado.', error);
    }
  }
}

function init() {
  updateHeaderDate();
  renderAll();
  setupEvents();
  registerServiceWorker().then(checkAdultReminders);
}

document.addEventListener('DOMContentLoaded', init);
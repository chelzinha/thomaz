'use strict';

(() => {
  const api = window.AgendaThomaz;
  if (!api) return;

  const POINTS = { school: 15, prepare: 10, test: 20, extra: 10, family: 10 };
  const ICONS = { school: '📚', prepare: '🎒', test: '🧠', extra: '🥋', family: '🏠' };
  const PROFILE_ICONS = { Thomaz: '🧑‍🚀', Rachel: '👩‍💻', Pai: '👨', Dora: '💃', Família: '🏡' };
  const PERIODS = {
    all: () => true,
    morning: hour => hour < 12,
    afternoon: hour => hour >= 12 && hour < 18,
    night: hour => hour >= 18
  };

  let activePeriod = 'all';
  let observer = null;

  function state() {
    return api.getState();
  }

  function taskPoints(task) {
    return POINTS[task.type] || 10;
  }

  function earnedPoints() {
    return state().tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + taskPoints(task), 0);
  }

  function todayTasks() {
    const today = api.toISO(api.localDate());
    return state().tasks.filter(task => task.date === today);
  }

  function profileName() {
    return state().activeProfile || 'Thomaz';
  }

  function buildKidbar() {
    if (document.querySelector('.mobile-kidbar')) return;
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const bar = document.createElement('div');
    bar.className = 'mobile-kidbar';
    bar.innerHTML = `
      <div class="mobile-profile-pill" aria-live="polite">
        <span class="mobile-profile-avatar" id="mobileProfileAvatar">🧑‍🚀</span>
        <span class="mobile-profile-copy">
          <small>Visualizando como</small>
          <strong id="mobileProfileName">Thomaz</strong>
        </span>
      </div>
      <button class="mobile-points-button" id="mobilePointsButton" type="button" aria-label="Abrir recompensas">
        <span>🪙</span><strong id="mobilePointsTotal">0</strong>
      </button>
    `;
    topbar.before(bar);
    document.querySelector('#mobilePointsButton')?.addEventListener('click', openRewards);
  }

  function buildDateStrip() {
    if (document.querySelector('.mobile-date-strip')) return;
    const familyStrip = document.querySelector('.family-strip');
    if (!familyStrip) return;

    const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
    const strip = document.createElement('div');
    strip.className = 'mobile-date-strip';
    strip.setAttribute('aria-label', 'Próximos dias');
    strip.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const date = api.localDate(index - 1);
      const day = formatter.format(date).replace('.', '').slice(0, 3);
      return `<div class="mobile-date-item ${index === 1 ? 'today' : ''}"><small>${day}</small><strong>${date.getDate()}</strong></div>`;
    }).join('');
    familyStrip.after(strip);
  }

  function buildDayparts() {
    if (document.querySelector('.mobile-dayparts')) return;
    const taskList = document.querySelector('#todayTaskList');
    if (!taskList) return;

    const tabs = document.createElement('div');
    tabs.className = 'mobile-dayparts';
    tabs.innerHTML = `
      <button class="mobile-daypart-button active" data-period="all">Tudo</button>
      <button class="mobile-daypart-button" data-period="morning">Manhã</button>
      <button class="mobile-daypart-button" data-period="afternoon">Tarde</button>
      <button class="mobile-daypart-button" data-period="night">Noite</button>
    `;
    taskList.before(tabs);
    tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-period]');
      if (!button) return;
      activePeriod = button.dataset.period;
      tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
      applyPeriodFilter();
    });
  }

  function buildJourney() {
    if (document.querySelector('.mobile-journey')) return;
    const action = document.querySelector('#focusActionButton');
    if (!action) return;

    const journey = document.createElement('div');
    journey.className = 'mobile-journey';
    journey.innerHTML = `
      <span class="mobile-journey-node">⚡</span>
      <span class="mobile-journey-track"><span id="mobileJourneyProgress"></span></span>
      <span class="mobile-journey-node end">🏁</span>
      <span class="mobile-journey-label" id="mobileJourneyLabel">Vamos começar</span>
    `;
    action.before(journey);
  }

  function buildMood() {
    if (document.querySelector('.mobile-mood-card')) return;
    const attention = document.querySelector('.attention-section');
    if (!attention) return;

    const card = document.createElement('section');
    card.className = 'mobile-mood-card';
    card.innerHTML = `
      <h3>Como você está agora?</h3>
      <p>Não existe resposta certa. Isso só ajuda a família a entender o seu momento.</p>
      <div class="mobile-mood-options">
        ${['😣','🙁','😐','🙂','😄'].map((emoji, index) => `<button class="mobile-mood-button" data-mood="${index + 1}" aria-label="Humor ${index + 1} de 5">${emoji}</button>`).join('')}
      </div>
    `;
    attention.after(card);
    card.addEventListener('click', event => {
      const button = event.target.closest('[data-mood]');
      if (!button) return;
      const today = api.toISO(api.localDate());
      localStorage.setItem(`agenda-thomaz-mood-${today}`, button.dataset.mood);
      card.querySelectorAll('[data-mood]').forEach(item => item.classList.toggle('selected', item === button));
      api.showToast('Humor registrado. Obrigada por contar.');
    });
    restoreMood();
  }

  function restoreMood() {
    const card = document.querySelector('.mobile-mood-card');
    if (!card) return;
    const today = api.toISO(api.localDate());
    const mood = localStorage.getItem(`agenda-thomaz-mood-${today}`);
    card.querySelectorAll('[data-mood]').forEach(item => item.classList.toggle('selected', item.dataset.mood === mood));
  }

  function buildRewardDialog() {
    if (document.querySelector('#mobileRewardDialog')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'mobile-reward-dialog';
    dialog.id = 'mobileRewardDialog';
    dialog.innerHTML = `
      <div class="mobile-reward-inner">
        <div class="mobile-reward-head">
          <div><h2>Minhas recompensas</h2><p>Privilégios combinados com os adultos da família.</p></div>
          <button class="mobile-reward-close" type="button" aria-label="Fechar">×</button>
        </div>
        <div class="mobile-reward-balance"><span>🪙</span><div><strong id="mobileRewardBalance">0 pontos</strong><small>As tarefas concluídas somam pontos automaticamente.</small></div></div>
        <div class="mobile-reward-list">
          ${rewardItem('🍿', 'Escolher o filme da família', 'Uma sessão no fim de semana', 80)}
          ${rewardItem('🎮', '20 minutos extras de jogo', 'Com autorização de um adulto', 100)}
          ${rewardItem('🍕', 'Escolher o jantar', 'Entre as opções disponíveis em casa', 120)}
          ${rewardItem('🎵', 'Escolher a playlist do carro', 'Durante um passeio da família', 60)}
          ${rewardItem('🎲', 'Escolher a brincadeira', 'Jogo, desafio ou atividade do dia', 90)}
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('.mobile-reward-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }

  function rewardItem(icon, title, detail, points) {
    return `<div class="mobile-reward-item"><span>${icon}</span><div><strong>${title}</strong><small>${detail}</small></div><div class="mobile-reward-cost">🪙 ${points}</div></div>`;
  }

  function openRewards() {
    buildRewardDialog();
    updatePoints();
    document.querySelector('#mobileRewardDialog')?.showModal();
  }

  function enhanceAvatars() {
    document.querySelectorAll('.avatar-button').forEach(button => {
      const icon = PROFILE_ICONS[button.dataset.profile];
      if (icon && button.textContent !== icon) button.textContent = icon;
    });
  }

  function enhanceTaskCards() {
    const tasksById = new Map(state().tasks.map(task => [task.id, task]));
    document.querySelectorAll('#todayTaskList .task-card').forEach(card => {
      const task = tasksById.get(card.dataset.taskId);
      if (!task) return;
      card.dataset.mobileIcon = ICONS[task.type] || '✅';
      const side = card.querySelector('.task-side');
      if (side && !side.querySelector('.mobile-task-points')) {
        const points = document.createElement('span');
        points.className = 'mobile-task-points';
        points.textContent = `🪙 ${taskPoints(task)}`;
        side.appendChild(points);
      }
    });
    applyPeriodFilter();
  }

  function applyPeriodFilter() {
    const predicate = PERIODS[activePeriod] || PERIODS.all;
    document.querySelectorAll('#todayTaskList .task-card').forEach(card => {
      const text = card.querySelector('.task-time')?.textContent || '';
      const match = text.match(/(\d{1,2}):(\d{2})/);
      const hour = match ? Number(match[1]) : 12;
      card.hidden = !predicate(hour);
    });
  }

  function updateJourney() {
    const tasks = todayTasks();
    const completed = tasks.filter(task => task.completed).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 100;
    const bar = document.querySelector('#mobileJourneyProgress');
    const label = document.querySelector('#mobileJourneyLabel');
    if (bar) bar.style.width = `${percent}%`;
    if (label) label.textContent = tasks.length
      ? `${completed} de ${tasks.length} missões concluídas hoje`
      : 'Dia livre, aproveite!';
  }

  function updatePoints() {
    const total = earnedPoints();
    const counter = document.querySelector('#mobilePointsTotal');
    const balance = document.querySelector('#mobileRewardBalance');
    if (counter) counter.textContent = total;
    if (balance) balance.textContent = `${total} pontos`;
  }

  function updateProfile() {
    const name = profileName();
    const label = document.querySelector('#mobileProfileName');
    const avatar = document.querySelector('#mobileProfileAvatar');
    if (label) label.textContent = name === 'Thomaz' ? 'Modo Thomaz' : `Modo ${name}`;
    if (avatar) avatar.textContent = PROFILE_ICONS[name] || '🙂';
  }

  function refresh() {
    enhanceAvatars();
    enhanceTaskCards();
    updateJourney();
    updatePoints();
    updateProfile();
    restoreMood();
  }

  function watchRenders() {
    observer?.disconnect();
    observer = new MutationObserver(() => refresh());
    const taskList = document.querySelector('#todayTaskList');
    const avatars = document.querySelector('#familyAvatars');
    if (taskList) observer.observe(taskList, { childList: true, subtree: true });
    if (avatars) observer.observe(avatars, { childList: true, subtree: true });
  }

  function init() {
    buildKidbar();
    buildDateStrip();
    buildDayparts();
    buildJourney();
    buildMood();
    buildRewardDialog();
    refresh();
    watchRenders();
    document.querySelector('#familyAvatars')?.addEventListener('click', () => window.setTimeout(refresh, 0));
    window.addEventListener('agenda:state-changed', refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

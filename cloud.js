import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  setPersistence,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const api = window.AgendaThomaz;
const runtime = window.__AGENDA_CONFIG__ || {};
const firebaseConfig = runtime.firebase || {};
const familyId = runtime.familyId || 'thomaz-family';
const adminEmail = String(runtime.adminEmail || '').trim().toLowerCase();
const calendarConfig = runtime.googleCalendar || {};
const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const firebaseReady = requiredFirebaseFields.every(field => Boolean(firebaseConfig[field]));

let auth = null;
let db = null;
let currentUser = null;
let currentFamilyData = null;
let unsubscribeTasks = null;
let calendarAccessToken = null;
let uploadTimer = null;
let cloudPanelReady = false;

const cleanEmail = value => String(value || '').trim().toLowerCase();
const isAdmin = user => cleanEmail(user?.email) === adminEmail;
const clone = value => JSON.parse(JSON.stringify(value));

function setupCloudPanel() {
  if (cloudPanelReady) return;
  const grid = document.querySelector('#view-settings .settings-grid');
  if (!grid) return;

  const panel = document.createElement('article');
  panel.className = 'panel cloud-panel';
  panel.id = 'cloudPanel';
  panel.innerHTML = `
    <div class="cloud-panel-heading">
      <div>
        <h3>Família conectada</h3>
        <p id="cloudStatusText">Modo local ativo</p>
      </div>
      <span class="cloud-status local" id="cloudStatusBadge">LOCAL</span>
    </div>
    <div class="cloud-user" id="cloudUserBlock">
      <div class="cloud-avatar">☁️</div>
      <div><strong>Nenhuma conta conectada</strong><small>Os dados estão somente neste aparelho.</small></div>
    </div>
    <div class="cloud-actions">
      <button class="primary-button" id="cloudLoginButton">Entrar com Google</button>
      <button class="secondary-button" id="calendarImportButton">Ler Google Agenda</button>
      <button class="secondary-button" id="calendarReminderButton">Criar lembretes</button>
      <button class="text-button hidden" id="cloudLogoutButton">Sair</button>
    </div>
    <div class="family-access hidden" id="familyAccessBlock">
      <label for="familyEmailInput">Autorizar familiar por e-mail</label>
      <div class="family-access-row">
        <input type="email" id="familyEmailInput" placeholder="familiar@gmail.com">
        <button id="familyEmailButton">Autorizar</button>
      </div>
      <small id="familyAccessList"></small>
    </div>
  `;
  grid.appendChild(panel);
  cloudPanelReady = true;

  document.querySelector('#cloudLoginButton')?.addEventListener('click', loginWithGoogle);
  document.querySelector('#cloudLogoutButton')?.addEventListener('click', logoutFromCloud);
  document.querySelector('#calendarImportButton')?.addEventListener('click', importGoogleCalendar);
  document.querySelector('#calendarReminderButton')?.addEventListener('click', createCalendarReminders);
  document.querySelector('#familyEmailButton')?.addEventListener('click', authorizeFamilyEmail);
}

function setCloudStatus(kind, text) {
  setupCloudPanel();
  const badge = document.querySelector('#cloudStatusBadge');
  const label = document.querySelector('#cloudStatusText');
  if (badge) {
    badge.className = `cloud-status ${kind}`;
    badge.textContent = kind === 'online' ? 'SINCRONIZADO' : kind === 'syncing' ? 'SINCRONIZANDO' : kind === 'error' ? 'ATENÇÃO' : 'LOCAL';
  }
  if (label) label.textContent = text;
}

function updateUserInterface() {
  setupCloudPanel();
  const loginButtons = [document.querySelector('#googleLoginButton'), document.querySelector('#cloudLoginButton')];
  const logoutButton = document.querySelector('#cloudLogoutButton');
  const userBlock = document.querySelector('#cloudUserBlock');
  const accessBlock = document.querySelector('#familyAccessBlock');
  const googleStatus = document.querySelector('#googleStatus');

  if (!currentUser) {
    loginButtons.forEach(button => {
      if (!button) return;
      button.textContent = firebaseReady ? 'Entrar com Google' : 'Configurar Google';
      button.classList.remove('connected');
    });
    logoutButton?.classList.add('hidden');
    accessBlock?.classList.add('hidden');
    if (googleStatus) googleStatus.textContent = firebaseReady ? 'Pronto para entrar' : 'Aguardando configuração do Firebase';
    if (userBlock) userBlock.innerHTML = '<div class="cloud-avatar">☁️</div><div><strong>Nenhuma conta conectada</strong><small>Os dados estão somente neste aparelho.</small></div>';
    return;
  }

  loginButtons.forEach(button => {
    if (!button) return;
    button.textContent = currentUser.displayName || currentUser.email || 'Conta conectada';
    button.classList.add('connected');
  });
  logoutButton?.classList.remove('hidden');
  if (googleStatus) googleStatus.textContent = `Conectado como ${currentUser.email}`;

  const photo = currentUser.photoURL
    ? `<img src="${currentUser.photoURL}" alt="">`
    : `<span>${(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}</span>`;
  if (userBlock) {
    userBlock.innerHTML = `<div class="cloud-avatar">${photo}</div><div><strong>${escapeText(currentUser.displayName || 'Familiar')}</strong><small>${escapeText(currentUser.email || '')}</small></div>`;
  }

  accessBlock?.classList.toggle('hidden', !isAdmin(currentUser));
  renderAuthorizedEmails();
}

function escapeText(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showSetupInstructions() {
  api.openInfo('Ativar login e sincronização', `
    <p>O aplicativo já está preparado, mas ainda precisa das credenciais públicas do projeto Firebase.</p>
    <ol>
      <li>Crie um projeto no Firebase.</li>
      <li>Registre um aplicativo Web.</li>
      <li>Ative Authentication com Google.</li>
      <li>Crie o Firestore em modo de produção.</li>
      <li>Cadastre as variáveis indicadas no arquivo <strong>docs/FIREBASE_SETUP.md</strong>.</li>
    </ol>
    <p>O modo local continua funcionando enquanto isso.</p>
  `);
}

async function loginWithGoogle() {
  if (!firebaseReady || !auth) {
    showSetupInstructions();
    return;
  }

  try {
    setCloudStatus('syncing', 'Abrindo o login do Google...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    setCloudStatus('error', readableAuthError(error));
    api.showToast(readableAuthError(error));
  }
}

async function logoutFromCloud() {
  if (!auth) return;
  await signOut(auth);
  api.showToast('Conta desconectada. O modo local continua disponível.');
}

function readableAuthError(error) {
  const code = error?.code || '';
  if (code.includes('popup-closed')) return 'O login foi fechado antes de terminar.';
  if (code.includes('popup-blocked')) return 'O navegador bloqueou a janela de login.';
  if (code.includes('unauthorized-domain')) return 'O domínio do Netlify precisa ser autorizado no Firebase.';
  if (code.includes('permission-denied')) return 'Esta conta ainda não foi autorizada pela família.';
  return 'Não foi possível concluir a conexão com o Google.';
}

async function ensureFamilyAccess(user) {
  const familyRef = doc(db, 'families', familyId);
  let familySnapshot;

  try {
    familySnapshot = await getDoc(familyRef);
  } catch (error) {
    if (!isAdmin(user)) throw error;
  }

  if (!familySnapshot?.exists()) {
    if (!isAdmin(user)) throw new Error('permission-denied');
    await setDoc(familyRef, {
      name: 'Família do Thomaz',
      allowedEmails: { [cleanEmail(user.email)]: true },
      admins: { [user.uid]: true },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    familySnapshot = await getDoc(familyRef);
  } else if (isAdmin(user)) {
    const data = familySnapshot.data();
    const allowedEmails = { ...(data.allowedEmails || {}), [cleanEmail(user.email)]: true };
    const admins = { ...(data.admins || {}), [user.uid]: true };
    await setDoc(familyRef, { allowedEmails, admins, updatedAt: serverTimestamp() }, { merge: true });
    familySnapshot = await getDoc(familyRef);
  }

  currentFamilyData = familySnapshot.data();
  const allowed = isAdmin(user) || currentFamilyData?.allowedEmails?.[cleanEmail(user.email)] === true;
  if (!allowed) throw new Error('permission-denied');

  await setDoc(doc(db, 'families', familyId, 'members', user.uid), {
    uid: user.uid,
    email: cleanEmail(user.email),
    name: user.displayName || '',
    photoURL: user.photoURL || '',
    role: isAdmin(user) ? 'admin' : 'family',
    lastSeenAt: serverTimestamp()
  }, { merge: true });
}

function subscribeToTasks() {
  unsubscribeTasks?.();
  const tasksCollection = collection(db, 'families', familyId, 'tasks');
  let firstSnapshot = true;

  unsubscribeTasks = onSnapshot(tasksCollection, async snapshot => {
    if (snapshot.empty && firstSnapshot) {
      firstSnapshot = false;
      await uploadTasks(api.getState().tasks);
      setCloudStatus('online', 'Dados deste aparelho enviados para a família.');
      return;
    }

    const tasks = snapshot.docs.map(item => {
      const data = item.data();
      delete data.updatedAt;
      delete data.updatedBy;
      return { ...data, id: item.id };
    });
    api.applyCloudTasks(tasks);
    firstSnapshot = false;
    setCloudStatus('online', `Sincronizado agora com ${tasks.length} atividade${tasks.length === 1 ? '' : 's'}.`);
  }, error => {
    console.error(error);
    setCloudStatus('error', 'Falha na sincronização. O modo local foi mantido.');
  });
}

async function uploadTasks(tasks) {
  if (!db || !currentUser || !Array.isArray(tasks)) return;
  setCloudStatus('syncing', 'Salvando alterações para a família...');
  const batch = writeBatch(db);

  tasks.slice(0, 450).forEach(task => {
    const taskRef = doc(db, 'families', familyId, 'tasks', task.id);
    const cleanTask = Object.fromEntries(Object.entries(clone(task)).filter(([, value]) => value !== undefined));
    batch.set(taskRef, {
      ...cleanTask,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    }, { merge: true });
  });

  await batch.commit();
  setCloudStatus('online', 'Alterações salvas para toda a família.');
}

function queueTaskUpload(event) {
  if (!currentUser || !db) return;
  window.clearTimeout(uploadTimer);
  uploadTimer = window.setTimeout(() => {
    uploadTasks(event.detail?.state?.tasks || api.getState().tasks).catch(error => {
      console.error(error);
      setCloudStatus('error', 'Não foi possível salvar agora. Os dados locais foram preservados.');
    });
  }, 700);
}

async function authorizeFamilyEmail() {
  if (!currentUser || !isAdmin(currentUser) || !db) return;
  const input = document.querySelector('#familyEmailInput');
  const email = cleanEmail(input?.value);
  if (!email || !email.includes('@')) {
    api.showToast('Digite um e-mail válido.');
    return;
  }

  const familyRef = doc(db, 'families', familyId);
  const snapshot = await getDoc(familyRef);
  const data = snapshot.data() || {};
  const allowedEmails = { ...(data.allowedEmails || {}), [email]: true };
  await setDoc(familyRef, { allowedEmails, updatedAt: serverTimestamp() }, { merge: true });
  currentFamilyData = { ...data, allowedEmails };
  if (input) input.value = '';
  renderAuthorizedEmails();
  api.showToast(`${email} foi autorizado.`);
}

function renderAuthorizedEmails() {
  const list = document.querySelector('#familyAccessList');
  if (!list) return;
  const emails = Object.keys(currentFamilyData?.allowedEmails || {}).sort();
  list.textContent = emails.length ? `Acesso autorizado: ${emails.join(', ')}` : 'Nenhum familiar adicional autorizado.';
}

function interceptButton(selector, handler) {
  document.querySelector(selector)?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    handler();
  }, true);
}

async function getCalendarAccessToken() {
  if (!auth?.currentUser) {
    await loginWithGoogle();
    if (!auth?.currentUser) throw new Error('login-required');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.calendarlist.readonly');
  provider.setCustomParameters({ prompt: 'consent' });
  const result = await reauthenticateWithPopup(auth.currentUser, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  calendarAccessToken = credential?.accessToken || null;
  if (!calendarAccessToken) throw new Error('calendar-token-missing');
  return calendarAccessToken;
}

async function googleApi(path, options = {}) {
  const token = calendarAccessToken || await getCalendarAccessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    calendarAccessToken = null;
    if (!options._retried) return googleApi(path, { ...options, _retried: true });
  }
  if (!response.ok) throw new Error(`google-calendar-${response.status}`);
  return response.json();
}

async function resolveCalendarId() {
  const configuredId = calendarConfig.calendarId || localStorage.getItem('agenda-thomaz-calendar-id');
  if (configuredId) return configuredId;

  const result = await googleApi('/users/me/calendarList?maxResults=250');
  const calendars = result.items || [];
  const selected = calendars.find(item => /^filhos\s*$/i.test(item.summary || ''))
    || calendars.find(item => /fam[ií]lia|family/i.test(item.summary || ''));
  if (!selected) throw new Error('family-calendar-not-found');
  localStorage.setItem('agenda-thomaz-calendar-id', selected.id);
  return selected.id;
}

function dateOnly(value) {
  return String(value || '').slice(0, 10);
}

function addDays(dateValue, amount) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + amount);
  return api.toISO(date);
}

function expandCalendarEvents(items) {
  const tasks = [];
  for (const item of items) {
    if (item.status === 'cancelled' || !item.start) continue;
    const startDate = dateOnly(item.start.date || item.start.dateTime);
    const endExclusive = item.end?.date
      ? dateOnly(item.end.date)
      : addDays(startDate, 1);
    let cursor = startDate;
    let guard = 0;

    while (cursor < endExclusive && guard < 31) {
      const isTimed = Boolean(item.start.dateTime) && cursor === startDate;
      const time = isTimed
        ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(item.start.dateTime))
        : '';
      const text = `${item.summary || ''} ${item.description || ''} ${item.location || ''}`;
      const owner = /f[aá]bio|casa do pai|com o pai/i.test(text) ? 'Pai' : 'Família';
      tasks.push({
        id: `gcal-${item.id}-${cursor}`,
        title: item.summary || 'Compromisso familiar',
        details: [item.location, item.description].filter(Boolean).join(' - ').slice(0, 500),
        type: 'family',
        date: cursor,
        time,
        owner,
        adult: false,
        completed: false,
        help: false,
        source: 'Google Calendar',
        calendarEventId: item.id,
        calendarUrl: item.htmlLink || ''
      });
      cursor = addDays(cursor, 1);
      guard += 1;
    }
  }
  return tasks;
}

async function importGoogleCalendar() {
  if (!firebaseReady) {
    showSetupInstructions();
    return;
  }

  try {
    setCloudStatus('syncing', 'Lendo o calendário dos filhos...');
    await getCalendarAccessToken();
    const calendarId = await resolveCalendarId();
    const timeMin = new Date(Date.now() - 86400000).toISOString();
    const timeMax = new Date(Date.now() + 120 * 86400000).toISOString();
    const query = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '500'
    });
    const result = await googleApi(`/calendars/${encodeURIComponent(calendarId)}/events?${query}`);
    const calendarTasks = expandCalendarEvents(result.items || []);
    api.mergeCalendarEvents(calendarTasks);
    setCloudStatus('online', `${calendarTasks.length} compromisso${calendarTasks.length === 1 ? '' : 's'} do calendário sincronizado${calendarTasks.length === 1 ? '' : 's'}.`);
    api.showToast('Google Agenda atualizado no aplicativo.');
  } catch (error) {
    console.error(error);
    const message = error.message === 'family-calendar-not-found'
      ? 'Não encontrei um calendário chamado Filhos, Família ou Family.'
      : 'Não foi possível ler o Google Agenda agora.';
    setCloudStatus('error', message);
    api.showToast(message);
  }
}

function taskDateTime(task) {
  const time = task.time || '19:00';
  const start = new Date(`${task.date}T${time}:00-03:00`);
  const end = new Date(start.getTime() + 30 * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function createCalendarReminders() {
  if (!firebaseReady) {
    showSetupInstructions();
    return;
  }

  try {
    setCloudStatus('syncing', 'Criando lembretes no Google Agenda...');
    await getCalendarAccessToken();
    const calendarId = await resolveCalendarId();
    const today = api.toISO(api.localDate());
    const limit = api.toISO(api.localDate(30));
    const pending = api.getState().tasks.filter(task =>
      task.adult
      && !task.completed
      && task.date >= today
      && task.date <= limit
      && !task.calendarEventId
      && task.source !== 'Google Calendar'
    );

    let created = 0;
    for (const task of pending) {
      const times = taskDateTime(task);
      const body = {
        summary: `🎒 ${task.title}`,
        description: `${task.details || ''}\n\nCriado pela Agenda do Thomaz.`,
        start: { dateTime: times.start, timeZone: 'America/Fortaleza' },
        end: { dateTime: times.end, timeZone: 'America/Fortaleza' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 1440 },
            { method: 'popup', minutes: 120 }
          ]
        },
        extendedProperties: { private: { agendaThomazTaskId: task.id } }
      };
      const event = await googleApi(`/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      api.patchTask(task.id, { calendarEventId: event.id, calendarUrl: event.htmlLink || '' });
      created += 1;
    }

    setCloudStatus('online', created ? `${created} lembrete${created === 1 ? '' : 's'} criado${created === 1 ? '' : 's'} no celular.` : 'Nenhum novo preparativo precisava de lembrete.');
    api.showToast(created ? 'Lembretes criados no Google Agenda.' : 'Os preparativos já estavam sincronizados.');
  } catch (error) {
    console.error(error);
    setCloudStatus('error', 'Não foi possível criar os lembretes no Google Agenda.');
    api.showToast('Não foi possível criar os lembretes agora.');
  }
}

async function initializeCloud() {
  setupCloudPanel();
  updateUserInterface();
  interceptButton('#googleLoginButton', loginWithGoogle);
  interceptButton('[data-integration="google"]', loginWithGoogle);
  interceptButton('#syncCalendarButton', importGoogleCalendar);
  interceptButton('[data-integration="calendar"]', importGoogleCalendar);
  window.addEventListener('agenda:state-changed', queueTaskUpload);

  if (!firebaseReady) {
    setCloudStatus('local', 'Modo local ativo. Falta conectar o projeto Firebase.');
    return;
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    await setPersistence(auth, browserLocalPersistence);

    onAuthStateChanged(auth, async user => {
      unsubscribeTasks?.();
      unsubscribeTasks = null;
      currentUser = user;
      currentFamilyData = null;
      updateUserInterface();

      if (!user) {
        setCloudStatus('local', 'Conta desconectada. Os dados locais continuam disponíveis.');
        return;
      }

      try {
        setCloudStatus('syncing', 'Confirmando o acesso da família...');
        await ensureFamilyAccess(user);
        updateUserInterface();
        subscribeToTasks();
      } catch (error) {
        console.error(error);
        setCloudStatus('error', 'Esta conta ainda não foi autorizada pela família.');
        api.openInfo('Acesso ainda não autorizado', '<p>Peça para Rachel autorizar este e-mail na área Família conectada. Depois, tente entrar novamente.</p>');
        await signOut(auth);
      }
    });
  } catch (error) {
    console.error(error);
    setCloudStatus('error', 'A configuração do Firebase não pôde ser iniciada.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCloud, { once: true });
} else {
  initializeCloud();
}

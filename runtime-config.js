window.__AGENDA_CONFIG__ = {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  familyId: 'thomaz-family',
  adminEmail: 'chelzinha@gmail.com',
  googleCalendar: {
    calendarId: '9f6c20fbf4f23efc223d60b2fd64bbf056bb3fe85379e24e5f6912421f9d3554@group.calendar.google.com'
  }
};

(() => {
  if (!document.querySelector('link[data-agenda-mobile]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'mobile.css';
    link.dataset.agendaMobile = 'true';
    document.head.appendChild(link);
  }

  const loadMobileUI = () => {
    if (document.querySelector('script[data-agenda-mobile]')) return;
    const script = document.createElement('script');
    script.src = 'mobile-ui.js';
    script.dataset.agendaMobile = 'true';
    document.body.appendChild(script);
  };

  if (document.readyState === 'complete') loadMobileUI();
  else window.addEventListener('load', loadMobileUI, { once: true });
})();

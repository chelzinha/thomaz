import { writeFileSync } from 'node:fs';

const env = process.env;
const config = {
  firebase: {
    apiKey: env.FIREBASE_API_KEY || '',
    authDomain: env.FIREBASE_AUTH_DOMAIN || '',
    projectId: env.FIREBASE_PROJECT_ID || '',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.FIREBASE_APP_ID || ''
  },
  familyId: env.AGENDA_FAMILY_ID || 'thomaz-family',
  adminEmail: env.AGENDA_ADMIN_EMAIL || 'chelzinha@gmail.com',
  googleCalendar: {
    calendarId: env.GOOGLE_CALENDAR_ID || ''
  }
};

const mobileLoader = `
(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }

  if (!document.querySelector('style[data-agenda-ios-fix]')) {
    const style = document.createElement('style');
    style.dataset.agendaIosFix = 'true';
    style.textContent = \`
      @media (max-width: 820px) {
        html {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          touch-action: manipulation;
        }

        input,
        select,
        textarea {
          font-size: 16px !important;
        }

        .task-dialog,
        .info-dialog {
          max-width: calc(100vw - 20px);
          overflow-x: hidden;
        }

        .task-dialog form,
        .info-dialog {
          max-width: 100%;
          overflow-x: hidden;
        }
      }
    \`;
    document.head.appendChild(style);
  }

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
`;

const output = `window.__AGENDA_CONFIG__ = ${JSON.stringify(config, null, 2)};\n${mobileLoader}`;
writeFileSync('runtime-config.js', output, 'utf8');
console.log('runtime-config.js gerado para o deploy.');

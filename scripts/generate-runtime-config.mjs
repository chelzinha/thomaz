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

const output = `window.__AGENDA_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;
writeFileSync('runtime-config.js', output, 'utf8');
console.log('runtime-config.js gerado para o deploy.');

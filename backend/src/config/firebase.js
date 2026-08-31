import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, './firebase-service-account.json');

let firebaseApp = null;
let messaging = null;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || 'school-management-system-83098',
    });

    messaging = admin.messaging();
    console.log('[Firebase] Admin SDK initialized successfully for project:', serviceAccount.project_id);
  } else {
    console.warn('[Firebase] Service account file not found at:', serviceAccountPath);
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error.message);
}

export { admin, firebaseApp, messaging };
export default messaging;

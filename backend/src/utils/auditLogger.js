import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {
    // Ignore error if already exists
  }
}

const auditLogFile = path.join(logDir, 'audit.log');

/**
 * Strips sensitive keys (passwords, tokens, secrets) before logging.
 */
function sanitizeMetadata(data) {
  if (!data || typeof data !== 'object') return data;
  const SENSITIVE_KEYS = new Set([
    'password',
    'temporaryPassword',
    'token',
    'refreshToken',
    'secret',
    'razorpayKeySecret',
    'jwtSecret',
    'authorization',
  ]);

  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Writes an immutable audit entry to stdout and logs/audit.log
 */
export function logAudit({
  action,
  user,
  resource,
  resourceId = null,
  status = 'SUCCESS',
  ip = null,
  details = {},
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    userId: user?.id || null,
    userRole: user?.role || 'ANONYMOUS',
    userName: user?.name || null,
    teacherId: user?.teacher?.id || null,
    resource,
    resourceId,
    status,
    ip: ip || null,
    details: sanitizeMetadata(details),
  };

  const line = JSON.stringify(entry);

  // Write to console in development / structured log collector in production
  console.log(`[AUDIT] ${entry.timestamp} | ${entry.userRole} | ${entry.action} | ${entry.resource} | ${entry.status}`);

  // Append to audit log file asynchronously
  try {
    fs.appendFile(auditLogFile, `${line}\n`, (err) => {
      if (err) {
        // Fallback: don't crash the server if file write fails
      }
    });
  } catch {
    // Suppress filesystem errors in ephemeral environments
  }

  return entry;
}

export default {
  logAudit,
};

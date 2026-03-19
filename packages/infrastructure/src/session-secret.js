import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { dataDir } from './paths.js';

const sessionSecretPath = path.join(dataDir, 'session.secret');

export async function ensureSessionSecret() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    const current = await fs.readFile(sessionSecretPath, 'utf8');
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // Fall through and generate a new secret.
  }

  const nextSecret = crypto.randomBytes(32).toString('hex');
  await fs.writeFile(sessionSecretPath, `${nextSecret}\n`, 'utf8');
  return nextSecret;
}

export const sessionSecretPaths = {
  dataDir,
  sessionSecretPath,
};

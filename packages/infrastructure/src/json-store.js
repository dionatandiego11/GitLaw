import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedStore } from '../../../server/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');
const dataDir = path.join(projectRoot, 'data');
const legacyDataDir = path.join(projectRoot, 'server', 'data');

const storePath = path.join(dataDir, 'store.json');
const chainDeploymentPath = path.join(dataDir, 'chain.deployment.json');
const legacyStorePath = path.join(legacyDataDir, 'store.json');
const legacyChainDeploymentPath = path.join(legacyDataDir, 'chain.deployment.json');

function cloneSeedStore() {
  return JSON.parse(JSON.stringify(seedStore));
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureStoreFile() {
  await fs.mkdir(dataDir, { recursive: true });

  if (await fileExists(storePath)) {
    return;
  }

  if (await fileExists(legacyStorePath)) {
    const legacyRaw = await fs.readFile(legacyStorePath, 'utf8');
    await fs.writeFile(storePath, legacyRaw, 'utf8');
    return;
  }

  await fs.writeFile(storePath, JSON.stringify(cloneSeedStore(), null, 2), 'utf8');
}

export async function loadStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw);
}

export async function saveStore(store) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}

export async function loadChainDeployment() {
  if (await fileExists(chainDeploymentPath)) {
    const raw = await fs.readFile(chainDeploymentPath, 'utf8');
    return JSON.parse(raw);
  }

  if (await fileExists(legacyChainDeploymentPath)) {
    const raw = await fs.readFile(legacyChainDeploymentPath, 'utf8');
    return JSON.parse(raw);
  }

  return null;
}

export const dataPaths = {
  dataDir,
  storePath,
  chainDeploymentPath,
};

import fs from 'node:fs/promises';
import path from 'node:path';
import { seedStore } from './seed-store.js';
import {
  dataDir,
  legacyDataDir,
  usingCustomDataDir,
} from './paths.js';

const storePath = path.join(dataDir, 'store.json');
const chainDeploymentPath = path.join(dataDir, 'chain.deployment.json');
const legacyStorePath = path.join(legacyDataDir, 'store.json');
const legacyChainDeploymentPath = path.join(legacyDataDir, 'chain.deployment.json');

function cloneSeedStore() {
  return JSON.parse(JSON.stringify(seedStore));
}

function withStoreDefaults(store) {
  return {
    neighborhoods: store.neighborhoods ?? [],
    citizens: store.citizens ?? [],
    citizenshipRequests: store.citizenshipRequests ?? [],
    laws: store.laws ?? [],
    commits: store.commits ?? [],
    proposals: store.proposals ?? [],
    forks: store.forks ?? [],
    activities: store.activities ?? [],
    events: store.events ?? [],
  };
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

  if (!usingCustomDataDir && await fileExists(legacyStorePath)) {
    const legacyRaw = await fs.readFile(legacyStorePath, 'utf8');
    await fs.writeFile(storePath, legacyRaw, 'utf8');
    return;
  }

  await fs.writeFile(storePath, JSON.stringify(cloneSeedStore(), null, 2), 'utf8');
}

export async function loadStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, 'utf8');
  return withStoreDefaults(JSON.parse(raw));
}

export async function saveStore(store) {
  await fs.mkdir(dataDir, { recursive: true });
  const nextStore = JSON.stringify(withStoreDefaults(store), null, 2);
  const tempPath = `${storePath}.tmp`;
  await fs.writeFile(tempPath, nextStore, 'utf8');
  await fs.rename(tempPath, storePath);
}

export async function loadChainDeployment() {
  if (await fileExists(chainDeploymentPath)) {
    const raw = await fs.readFile(chainDeploymentPath, 'utf8');
    return JSON.parse(raw);
  }

  if (!usingCustomDataDir && await fileExists(legacyChainDeploymentPath)) {
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

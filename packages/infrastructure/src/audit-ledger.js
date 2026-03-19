import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir } from './paths.js';

const auditLogPath = path.join(dataDir, 'audit-log.ndjson');

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function buildSnapshotDigest(store) {
  return crypto.createHash('sha256').update(JSON.stringify(store)).digest('hex');
}

function buildStoreStats(store) {
  return {
    neighborhoods: store.neighborhoods?.length ?? 0,
    citizens: store.citizens?.length ?? 0,
    requests: store.citizenshipRequests?.length ?? 0,
    laws: store.laws?.length ?? 0,
    commits: store.commits?.length ?? 0,
    proposals: store.proposals?.length ?? 0,
    forks: store.forks?.length ?? 0,
    activities: store.activities?.length ?? 0,
    events: store.events?.length ?? 0,
  };
}

export async function ensureAuditLogFile() {
  await fs.mkdir(dataDir, { recursive: true });

  if (!(await fileExists(auditLogPath))) {
    await fs.writeFile(auditLogPath, '', 'utf8');
  }
}

export async function appendAuditEntry(store, {
  action = 'store_write',
  actorAddress = null,
  newEvents = [],
  protocol = null,
} = {}) {
  await ensureAuditLogFile();

  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    actorAddress,
    eventCount: newEvents.length,
    eventIds: newEvents.map((event) => event.id),
    eventTypes: [...new Set(newEvents.map((event) => event.type))],
    snapshotDigest: buildSnapshotDigest(store),
    stats: buildStoreStats(store),
    protocol: protocol
      ? {
          pending: protocol.pending,
          anchored: protocol.anchored,
          blocked: protocol.blocked,
          failed: protocol.failed,
          recentTaskIds: protocol.recentTaskIds,
        }
      : null,
  };

  await fs.appendFile(auditLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

export async function loadAuditEntries(limit = 50) {
  await ensureAuditLogFile();
  const raw = await fs.readFile(auditLogPath, 'utf8');
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .slice(-Math.max(Number(limit) || 50, 1))
    .map((line) => JSON.parse(line))
    .reverse();
}

export const auditPaths = {
  dataDir,
  auditLogPath,
};

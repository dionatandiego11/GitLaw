import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, '../../../');
export const legacyDataDir = path.join(projectRoot, 'server', 'data');
export const usingCustomDataDir = Boolean(process.env.GITLAW_DATA_DIR);
export const dataDir = process.env.GITLAW_DATA_DIR
  ? path.resolve(projectRoot, process.env.GITLAW_DATA_DIR)
  : path.join(projectRoot, 'data');

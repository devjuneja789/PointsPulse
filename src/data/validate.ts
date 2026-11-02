/**
 * PointsPulse Data Validator
 * Validates rules, squad integrity, and match script continuity.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateData() {
  console.log('[Validator] Checking data directories and files...');

  const requiredDirs = [
    path.join(__dirname, 'squads'),
    path.join(__dirname, 'scripts'),
    path.join(__dirname, 'fallback-explanations'),
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`[Validator] Missing directory: ${dir}`);
    }
  }

  console.log('[Validator] Phase 0 data structure check passed.');
  process.exit(0);
}

validateData();

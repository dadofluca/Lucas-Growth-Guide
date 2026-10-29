import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const workflow of [
  '.github/workflows/browser-smoke.yml',
  '.github/workflows/scheduled-ui-audit.yml',
]) {
  test(`${workflow} pins a Playwright-compatible GitHub runner`, () => {
    const config = readFileSync(resolve(repoRoot, workflow), 'utf8');
    assert.match(config, /^\s*runs-on:\s*ubuntu-24\.04\s*$/m);
    assert.doesNotMatch(config, /^\s*runs-on:\s*ubuntu-latest\s*$/m);
    assert.match(config, /npx playwright install --with-deps chromium/);
  });
}

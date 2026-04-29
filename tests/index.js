// ==============================
// Test Runner
// Run all tests: node tests/index.js
// ==============================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTest(file) {
  console.log(`\nRunning ${file}...`);
  try {
    execSync(`node ${file}`, { stdio: 'inherit' });
    console.log(`${file} passed`);
  } catch (error) {
    console.log(`${file} failed`);
    process.exit(1);
  }
}

function main() {
  const testDir = path.join(__dirname);
  const testFiles = fs.readdirSync(testDir)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(testDir, file));

  console.log('Starting test suite...\n');

  for (const file of testFiles) {
    runTest(file);
  }

  console.log('\nAll tests completed successfully! 🎉');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
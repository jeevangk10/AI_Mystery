const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const sourceRoots = ['src', 'test', 'scripts'];
const javascriptFiles = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) javascriptFiles.push(fullPath);
  }
}

for (const root of sourceRoots) collect(root);

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.info(`Syntax checked ${javascriptFiles.length} backend JavaScript files.`);

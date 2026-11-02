const fs = require('node:fs');
const path = require('node:path');
const env = require('../backend/src/config/env');

const assetDirectory = path.resolve(__dirname, '../frontend/dist');
const assets = [];

function collect(directory) {
  if (!fs.existsSync(directory)) throw new Error('Frontend build output is missing; run the frontend build first.');
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile() && /\.(?:js|css|html)$/i.test(entry.name)) assets.push(fullPath);
  }
}

collect(assetDirectory);

const configuredSecrets = [env.GEMINI_API_KEY, env.SESSION_SECRET]
  .filter((value) => typeof value === 'string' && value.length >= 12);
const leakedPattern = /AIza[0-9A-Za-z_-]{30,}|mongodb(?:\+srv)?:\/\/[^\s"'<>]+/i;

for (const asset of assets) {
  const content = fs.readFileSync(asset, 'utf8');
  if (configuredSecrets.some((secret) => content.includes(secret)) || leakedPattern.test(content)) {
    throw new Error('A possible backend credential was found in the frontend build output.');
  }
}

console.info(`Frontend bundle secret scan passed (${assets.length} built assets checked).`);

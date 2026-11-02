const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const processes = [
  {
    name: 'backend',
    args: ['--watch', 'src/server.js'],
    cwd: path.join(root, 'backend'),
  },
  {
    name: 'frontend',
    args: ['node_modules/vite/bin/vite.js', '--configLoader', 'runner', '--host', '127.0.0.1'],
    cwd: path.join(root, 'frontend'),
  },
].map((config) => ({
  ...config,
  child: spawn(process.execPath, config.args, {
    cwd: config.cwd,
    stdio: 'inherit',
    windowsHide: true,
  }),
}));

function stopAll(signal = 'SIGTERM') {
  for (const processInfo of processes) {
    if (!processInfo.child.killed) processInfo.child.kill(signal);
  }
}

for (const processInfo of processes) {
  processInfo.child.on('error', (error) => {
    console.error(`${processInfo.name} failed to start: ${error.message}`);
    stopAll();
    process.exitCode = 1;
  });
  processInfo.child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${processInfo.name} exited with code ${code}.`);
      stopAll();
      process.exitCode = code;
    }
  });
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
    process.loadEnvFile(envFile);
}

if (!process.env.OVSX_PAT) {
    console.error('No Open VSX token found. Add it after OVSX_PAT= in the .env file, then run this again.');
    process.exit(1);
}

const result = spawnSync('npx', ['ovsx', 'publish'], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);

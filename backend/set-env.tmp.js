const { spawn } = require('child_process');

const envs = [
  ['JWT_ACCESS_SECRET', 'vconnect-super-secret-key-change-in-production-2024'],
  ['JWT_REFRESH_SECRET', 'vconnect-refresh-secret-key-change-in-production-2024'],
  ['JWT_EXPIRES_IN', '15m'],
  ['JWT_REFRESH_EXPIRES_IN', '7d'],
  ['FRONTEND_URL', 'https://vignan-connect.vercel.app'],
  ['N8N_ENABLED', 'false'],
  ['SESSION_SECRET', 'vconnect-session-hmac-secret'],
];

async function run() {
  for (const [k, v] of envs) {
    await new Promise((resolve, reject) => {
      const p = spawn('npx.cmd', ['-y', 'vercel', 'env', 'add', k, 'production'], {
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: true
      });
      p.on('close', code => {
        if (code === 0) resolve(); else reject(new Error('Failed ' + k));
      });
      p.stdin.write(v);
      p.stdin.end();
    });
  }
}

run().catch(console.error);

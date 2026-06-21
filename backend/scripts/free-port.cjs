/**
 * Frees the backend port before start:dev to avoid EADDRINUSE on Windows watch restarts.
 */
const { execSync } = require('child_process');

const port = String(process.env.PORT || 3000);

function freePortWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const pids = new Set();
    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[free-port] Stopped process ${pid} on port ${targetPort}`);
      } catch {
        /* already exited */
      }
    }
  } catch {
    /* no listeners */
  }
}

function freePortUnix(targetPort) {
  try {
    execSync(`lsof -ti:${targetPort} | xargs kill -9 2>/dev/null || true`, {
      stdio: 'ignore',
      shell: true,
    });
  } catch {
    /* no listeners */
  }
}

if (process.platform === 'win32') {
  freePortWindows(port);
} else {
  freePortUnix(port);
}

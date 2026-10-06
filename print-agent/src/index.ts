import fs from 'fs';
import path from 'path';
import { AgentSocketManager } from './socket/agent.socket';
import { printerService } from './printer/windows.printer';
import { config } from './config';

function ensureSingleInstance(): void {
  const lockFilePath = path.join(__dirname, '..', 'agent.lock');
  try {
    if (fs.existsSync(lockFilePath)) {
      const existingPidStr = fs.readFileSync(lockFilePath, 'utf8').trim();
      const existingPid = parseInt(existingPidStr, 10);
      if (!isNaN(existingPid)) {
        try {
          process.kill(existingPid, 0);
          console.error(`[Print Agent Lock Error] Another Print Agent instance (PID: ${existingPid}) is already running!`);
          console.error(`[Print Agent Lock Error] Exiting process ${process.pid} to prevent duplicate printing.`);
          process.exit(0);
        } catch (e) {
          console.log(`[Print Agent Lock] Removing stale lock file from previous process ${existingPid}`);
        }
      }
    }
    fs.writeFileSync(lockFilePath, String(process.pid), 'utf8');

    const cleanup = () => {
      try {
        if (fs.existsSync(lockFilePath)) {
          fs.unlinkSync(lockFilePath);
        }
      } catch (err) {}
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  } catch (err) {
    console.warn('[Print Agent Lock Warning] Unable to enforce lock file check:', err);
  }
}

async function bootstrap() {
  ensureSingleInstance();

  console.log(`==================================================`);
  console.log(`🐆 LeopardX Xerox Local Print Agent`);
  console.log(`📍 Machine Code: ${config.machineCode}`);
  console.log(`🔗 Target Backend: ${config.backendUrl}`);
  console.log(`🧪 Simulation Mode: ${config.printSimulationMode ? 'ENABLED (true)' : 'DISABLED (false)'}`);
  console.log(`==================================================`);

  if (config.printSimulationMode) {
    console.log(`[Print Agent SIMULATION] Simulation mode enabled. Skipping physical printer check.`);
  } else {
    // Log available printers on host PC when real printer mode is enabled
    try {
      const status = await printerService.getPrinterStatus();
      console.log(`🖨️ Local Printers Detected:`, status.printersAvailable);
    } catch (err) {
      console.warn(`🖨️ Could not query local printers:`, err);
    }
  }

  // Connect to server
  const agentSocket = new AgentSocketManager();
  agentSocket.connect();
}

bootstrap().catch((err) => {
  console.error('[Print Agent Fatal Bootstrap Error]', err);
  process.exit(1);
});

import { AgentSocketManager } from './socket/agent.socket';
import { printerService } from './printer/windows.printer';
import { config } from './config';

async function bootstrap() {
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

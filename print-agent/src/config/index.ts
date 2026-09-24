import dotenv from 'dotenv';
dotenv.config();

export const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  machineCode: process.env.MACHINE_CODE || 'PUNE-COLLEGE-001',
  machineToken: process.env.MACHINE_TOKEN || 'secret-agent-token-001',
  printerName: process.env.PRINTER_NAME || '',
  printSimulationMode: process.env.PRINT_SIMULATION_MODE !== undefined ? process.env.PRINT_SIMULATION_MODE === 'true' : true,
};

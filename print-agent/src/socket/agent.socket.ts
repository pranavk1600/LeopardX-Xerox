import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { printerService } from '../printer/windows.printer';
import { fileDownloaderService } from '../services/downloader.service';

export class AgentSocketManager {
  private socket: Socket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProcessingJob = false;

  public connect(): void {
    console.log(`[Print Agent] Connecting to backend server at ${config.backendUrl}...`);

    this.socket = io(config.backendUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log(`[Print Agent] Connected to server (Socket ID: ${this.socket?.id})`);
      this.authenticate();
    });

    this.socket.on('agent:authenticated', (res: { success: boolean; machineCode: string }) => {
      console.log(`[Print Agent ✅] Authentication successful for kiosk: ${res.machineCode}`);
      this.startHeartbeat();
    });

    this.socket.on('agent:auth-failed', (data: { message: string }) => {
      console.error(`[Print Agent ❌] Authentication failed: ${data.message}`);
    });

    this.socket.on('print-job:dispatch', async (jobData: any) => {
      console.log(`[Print Agent 🖨️] Received incoming print job:`, jobData);
      await this.handlePrintJob(jobData);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`[Print Agent ⚠️] Disconnected from server. Reason: ${reason}`);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error(`[Print Agent Connection Error] ${error.message}. Retrying...`);
    });
  }

  private authenticate(): void {
    if (!this.socket) return;
    console.log(`[Print Agent] Authenticating machine: ${config.machineCode}`);
    this.socket.emit('agent:authenticate', {
      machineCode: config.machineCode,
      token: config.machineToken,
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('agent:heartbeat', { machineCode: config.machineCode });
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async handlePrintJob(jobData: any): Promise<void> {
    const { id: jobId, fileName, fileUrl, selectedPages, copies, colorMode, paperSize } = jobData;

    console.log(`[Print Agent] Received print job: ${jobId}`);

    if (config.printSimulationMode) {
      console.log(`[Print Agent SIMULATION] Starting simulated printing...`);

      // 1. Report status: PRINTING
      this.reportStatus(jobId, 'PRINTING');

      // 2. Simulate print execution delay (wait 2–3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 3. Report status: COMPLETED
      console.log(`[Print Agent SIMULATION] Print completed successfully`);
      this.reportStatus(jobId, 'COMPLETED');
      console.log(`[Print Agent] Job ${jobId} status: COMPLETED`);
      return;
    }

    // REAL PRINTER FLOW (when PRINT_SIMULATION_MODE=false)
    try {
      // 1. Report status: PRINTING
      this.reportStatus(jobId, 'PRINTING');

      // 2. Download file locally
      const localFilePath = await fileDownloaderService.downloadFile(config.backendUrl, fileUrl, fileName);

      // 3. Trigger printer service
      console.log(`[Print Agent] Sending file ${fileName} to local printer...`);
      const success = await printerService.printDocument(localFilePath, {
        copies: copies || 1,
        selectedPages: selectedPages || 'all',
        colorMode: colorMode || 'BW',
        paperSize: paperSize || 'A4',
        printerName: config.printerName || undefined,
      });

      // Cleanup local temp file
      fileDownloaderService.cleanupFile(localFilePath);

      if (success) {
        console.log(`[Print Agent ✅] Print job ${jobId} COMPLETED successfully!`);
        this.reportStatus(jobId, 'COMPLETED');
        console.log(`[Print Agent] Job ${jobId} status: COMPLETED`);
      } else {
        console.error(`[Print Agent ❌] Print job ${jobId} FAILED during printing execution.`);
        this.reportStatus(jobId, 'FAILED', 'Printer spooler execution failed');
      }
    } catch (error: any) {
      console.error(`[Print Agent Error processing job ${jobId}]`, error);
      this.reportStatus(jobId, 'FAILED', error?.message || 'Print agent error');
    }
  }

  private reportStatus(jobId: string, status: string, errorMessage?: string): void {
    if (this.socket && this.socket.connected) {
      console.log(`[Print Agent -> Backend] Emitting job status: ${status} for job ${jobId}`);
      this.socket.emit('agent:job-status', {
        jobId,
        status,
        errorMessage,
      });
    }
  }
}

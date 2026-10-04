import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { printerService } from '../printer/windows.printer';
import { fileDownloaderService } from '../services/downloader.service';

export class AgentSocketManager {
  private socket: Socket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activeJobs: Set<string> = new Set();
  private processedJobs: Set<string> = new Set();

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

    // Remove previous listeners to prevent duplicate execution on reconnects
    this.socket.off('connect');
    this.socket.off('agent:authenticated');
    this.socket.off('agent:auth-failed');
    this.socket.off('print-job:dispatch');
    this.socket.off('disconnect');
    this.socket.off('connect_error');

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
      await this.handlePrintJob(jobData);
    });
    console.log('[Socket] Print listener registered');

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
    const { id: jobId, fileName, fileUrl, selectedPages, copies, colorMode, paperSize, printType } = jobData;
    const targetCopies = Math.max(1, Number(copies) || 1);

    console.log(`[Print Agent] Received print job: ${jobId}`);
    console.log(`[Print Agent] Requested copies: ${targetCopies}`);

    if (!jobId) {
      console.error(`[Print Agent ❌] Received print job without valid ID.`);
      return;
    }

    // Strong Idempotency Check: Ignore duplicate job requests
    if (this.activeJobs.has(jobId) || this.processedJobs.has(jobId)) {
      console.warn(`[Print Agent] DUPLICATE JOB RECEIVED: ${jobId}`);
      console.warn(`[Print Agent] DUPLICATE PRINT BLOCKED: ${jobId}`);
      return;
    }

    this.activeJobs.add(jobId);

    if (config.printSimulationMode) {
      console.log(`[Print Agent SIMULATION] Starting simulated printing: ${jobId}`);

      // 1. Report status: PRINTING
      this.reportStatus(jobId, 'PRINTING');

      // 2. Simulate print execution delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 3. Report status: COMPLETED
      console.log(`[Print Agent SIMULATION] Print completed successfully: ${jobId}`);
      this.reportStatus(jobId, 'COMPLETED');
      this.activeJobs.delete(jobId);
      this.markProcessed(jobId);
      return;
    }

    // REAL PRINTER FLOW (when PRINT_SIMULATION_MODE=false)
    try {
      // 1. Report status: PRINTING
      this.reportStatus(jobId, 'PRINTING');
      console.log(`[Print Agent] Starting physical print: ${jobId}`);

      // 2. Download file locally
      const localFilePath = await fileDownloaderService.downloadFile(config.backendUrl, fileUrl, fileName);

      // 3. Trigger printer service
      console.log(`[Print Agent] Sending file ${fileName} to local printer...`);
      const success = await printerService.printDocument(localFilePath, {
        jobId,
        copies: targetCopies,
        selectedPages: selectedPages || 'all',
        colorMode: colorMode || 'BW',
        paperSize: paperSize || 'A4',
        printType: printType || 'SINGLE_SIDE',
        printerName: config.printerName || undefined,
      });

      // Cleanup local temp file
      fileDownloaderService.cleanupFile(localFilePath);

      if (success) {
        console.log(`[Print Agent] Physical print completed: ${jobId}`);
        this.reportStatus(jobId, 'COMPLETED');
      } else {
        console.error(`[Print Agent ❌] Print job ${jobId} FAILED during printing execution.`);
        this.reportStatus(jobId, 'FAILED', 'Printer spooler execution failed');
      }
    } catch (error: any) {
      console.error(`[Print Agent Error processing job ${jobId}]`, error);
      this.reportStatus(jobId, 'FAILED', error?.message || 'Print agent error');
    } finally {
      this.activeJobs.delete(jobId);
      this.markProcessed(jobId);
    }
  }

  private markProcessed(jobId: string): void {
    this.processedJobs.add(jobId);
    // Keep max 1000 items in memory to prevent memory leaks over long uptime
    if (this.processedJobs.size > 1000) {
      const firstItem = this.processedJobs.values().next().value;
      if (firstItem) {
        this.processedJobs.delete(firstItem);
      }
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

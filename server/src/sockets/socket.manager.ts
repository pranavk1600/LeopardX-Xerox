import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { prisma } from '../config/prisma';
import { PrintJobStatus } from '@prisma/client';
import { storageService } from '../services/storage.service';
import { pricingService } from '../services/pricing.service';

export class SocketManager {
  private io: Server;
  private agentSockets: Map<string, string> = new Map(); // machineCode -> socketId
  private dispatchedJobs: Set<string> = new Set();

  constructor(server: HttpServer, clientUrl: string) {
    const allowedOrigins = [
      clientUrl,
      'https://leopard-x-xerox.vercel.app',
      'https://localhost',
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

    this.io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] New connection established: ${socket.id}`);

      // Agent Authentication
      socket.on('agent:authenticate', async (data: { machineCode: string; token: string }) => {
        try {
          const { machineCode, token } = data;
          const normalizedCode = (machineCode || '').trim().toUpperCase();
          const machine = await prisma.machine.findFirst({
            where: {
              machineCode: {
                equals: normalizedCode,
                mode: 'insensitive',
              },
            },
          });

          if (!machine || machine.token !== token) {
            console.warn(`[Socket Agent Auth Failed] Invalid machine credentials for code: ${machineCode}`);
            socket.emit('agent:auth-failed', { message: 'Invalid machine credentials' });
            return;
          }

          // Mark machine ONLINE in DB and save authoritative socket mapping
          await prisma.machine.update({
            where: { id: machine.id },
            data: { status: 'ONLINE' },
          });

          this.agentSockets.set(normalizedCode, socket.id);
          socket.join(`machine:${normalizedCode}`);
          socket.data.machineCode = normalizedCode;
          socket.data.isAgent = true;

          console.log(`[Socket Agent Auth Success] Machine ${normalizedCode} is now connected & ONLINE (Socket ID: ${socket.id}).`);
          socket.emit('agent:authenticated', { success: true, machineCode: normalizedCode });
          
          // Broadcast machine status update
          this.io.emit('machine:status-change', { machineCode: normalizedCode, status: 'ONLINE' });

          // Query and auto-dispatch any pending QUEUED jobs for this machine upon connect/reconnect
          const pendingJobs = await prisma.printJob.findMany({
            where: {
              machineId: machine.id,
              status: 'QUEUED',
            },
            orderBy: { createdAt: 'asc' },
          });

          if (pendingJobs.length > 0) {
            console.log(`[Socket Agent Reconnect] Found ${pendingJobs.length} QUEUED job(s) for machine ${normalizedCode}. Dispatching...`);
            for (const job of pendingJobs) {
              this.dispatchJobToAgent(normalizedCode, {
                id: job.id,
                fileName: job.fileName,
                fileUrl: job.fileUrl,
                selectedPages: job.selectedPages,
                copies: job.copies,
                colorMode: job.colorMode,
                paperSize: job.paperSize,
                printType: job.printType,
              });
            }
          }
        } catch (error) {
          console.error('[Socket Agent Auth Error]', error);
          socket.emit('agent:auth-failed', { message: 'Server authentication error' });
        }
      });

      // Join client room to listen to job progress
      socket.on('job:subscribe', (jobId: string) => {
        socket.join(`job:${jobId}`);
        console.log(`[Socket Client] Client ${socket.id} subscribed to job updates for ${jobId}`);
      });

      // Agent Job Status Update
      socket.on('agent:job-status', async (data: { jobId: string; status: PrintJobStatus; errorMessage?: string }) => {
        try {
          const { jobId, status, errorMessage } = data;
          console.log(`[Backend Received Agent Status] Job ${jobId} -> Status: ${status}`);

          const existingJob = await prisma.printJob.findUnique({ where: { id: jobId } });

          let updatedJobRecord;

          // Deduct paper stock ONLY when status transitions to COMPLETED for the first time
          if (status === 'COMPLETED' && existingJob && existingJob.status !== 'COMPLETED') {
            const paperUsed = pricingService.calculatePhysicalSheets({
              totalPages: existingJob.totalPages,
              selectedPages: existingJob.selectedPages,
              copies: existingJob.copies,
              printType: existingJob.printType,
            });

            // Update DB record with COMPLETED status & paperUsed
            updatedJobRecord = await prisma.printJob.update({
              where: { id: jobId },
              data: { status, paperUsed },
            });

            // Atomic paper deduction
            await prisma.machine.update({
              where: { id: updatedJobRecord.machineId },
              data: {
                paperStock: {
                  decrement: paperUsed,
                },
              },
            });

            // Safety check: ensure paperStock is non-negative
            const updatedMachine = await prisma.machine.findUnique({ where: { id: updatedJobRecord.machineId } });
            if (updatedMachine && updatedMachine.paperStock < 0) {
              await prisma.machine.update({
                where: { id: updatedJobRecord.machineId },
                data: { paperStock: 0 },
              });
            }

            console.log(`[Paper Stock] Deducted ${paperUsed} physical sheet(s) for Job ${jobId}. Remaining Stock: ${Math.max(0, (updatedMachine?.paperStock || 0))}`);

            if (updatedJobRecord.fileName) {
              storageService.deleteTemporaryPdf(updatedJobRecord.fileName);
            }
          } else {
            // Update DB record for non-COMPLETED statuses
            updatedJobRecord = await prisma.printJob.update({
              where: { id: jobId },
              data: { status },
            });
          }

          // Notify subscribed clients
          console.log(`[Backend -> Frontend] Emitting job:updated for ${jobId} -> Status: ${status}`);
          this.io.to(`job:${jobId}`).emit('job:updated', {
            jobId,
            status,
            errorMessage,
            updatedAt: updatedJobRecord.updatedAt,
          });
        } catch (error) {
          console.error('[Socket Job Status Error]', error);
        }
      });

      // Agent Heartbeat
      socket.on('agent:heartbeat', (data: { machineCode: string }) => {
        // Keeps socket active and updates state if needed
        socket.emit('agent:heartbeat-ack', { timestamp: Date.now() });
      });

      // Disconnect handling with stale socket guard
      socket.on('disconnect', async () => {
        const machineCode = socket.data.machineCode;
        if (socket.data.isAgent && machineCode) {
          const normalizedCode = machineCode.trim().toUpperCase();
          const currentActiveSocketId = this.agentSockets.get(normalizedCode);

          // CRITICAL: Only transition to OFFLINE if this disconnecting socket is the currently active socket
          if (currentActiveSocketId === socket.id) {
            console.log(`[Socket Agent Disconnected] Machine ${normalizedCode} went OFFLINE (Socket ID: ${socket.id}).`);
            this.agentSockets.delete(normalizedCode);
            try {
              await prisma.machine.update({
                where: { machineCode: normalizedCode },
                data: { status: 'OFFLINE' },
              });
              this.io.emit('machine:status-change', { machineCode: normalizedCode, status: 'OFFLINE' });
            } catch (e) {
              console.error('[Socket Disconnect DB Update Error]', e);
            }
          } else {
            console.log(`[Socket Disconnect Ignored] Stale socket ${socket.id} disconnected for machine ${normalizedCode}. Active socket remains ${currentActiveSocketId}.`);
          }
        }
      });
    });
  }

  // Helper method to check if an agent is currently connected and active
  public isAgentConnected(machineCode: string): boolean {
    const normalizedCode = (machineCode || '').trim().toUpperCase();
    const socketId = this.agentSockets.get(normalizedCode);
    if (!socketId) return false;
    const socket = this.io.sockets.sockets.get(socketId);
    return Boolean(socket && socket.connected);
  }

  // Method to dispatch job to connected Print Agent
  public dispatchJobToAgent(machineCode: string, jobData: any): boolean {
    const normalizedCode = (machineCode || '').trim().toUpperCase();
    const jobId = jobData.id || jobData.jobId;

    if (jobId && this.dispatchedJobs.has(jobId)) {
      console.warn(`[Print Dispatch] DUPLICATE DISPATCH BLOCKED: ${jobId}`);
      return true;
    }

    let socketId = this.agentSockets.get(normalizedCode);
    if (!socketId) {
      for (const [code, id] of this.agentSockets.entries()) {
        if (code.toUpperCase() === normalizedCode) {
          socketId = id;
          break;
        }
      }
    }

    // Verify active socket exists AND is currently connected
    if (!socketId || !this.io.sockets.sockets.get(socketId)?.connected) {
      console.warn(`[Socket Dispatch Warning] No active agent socket for machine: ${machineCode} (Looked up socketId: ${socketId})`);
      return false;
    }

    if (jobId) {
      this.dispatchedJobs.add(jobId);
      if (this.dispatchedJobs.size > 1000) {
        const firstItem = this.dispatchedJobs.values().next().value;
        if (firstItem) this.dispatchedJobs.delete(firstItem);
      }
    }

    console.log(`[Socket] Emitting print job to active socket ${socketId} for machine:${normalizedCode}`);
    console.log(`[Print Dispatch] Job ${jobData.id} dispatched to machine ${normalizedCode}`);
    this.io.to(socketId).emit('print-job:dispatch', jobData);
    console.log(`[Socket Dispatch Success] Dispatched job ${jobData.id} to machine ${normalizedCode} via socket ${socketId}`);
    return true;
  }

  public getIO(): Server {
    return this.io;
  }
}

export let socketManagerInstance: SocketManager | null = null;

export const initSocketManager = (server: HttpServer, clientUrl: string): SocketManager => {
  socketManagerInstance = new SocketManager(server, clientUrl);
  return socketManagerInstance;
};

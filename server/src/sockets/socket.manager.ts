import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { prisma } from '../config/prisma';
import { PrintJobStatus } from '@prisma/client';

export class SocketManager {
  private io: Server;
  private agentSockets: Map<string, string> = new Map(); // machineCode -> socketId

  constructor(server: HttpServer, clientUrl: string) {
    this.io = new Server(server, {
      cors: {
        origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
          const machine = await prisma.machine.findUnique({ where: { machineCode } });

          if (!machine || machine.token !== token) {
            console.warn(`[Socket Agent Auth Failed] Invalid machine credentials for code: ${machineCode}`);
            socket.emit('agent:auth-failed', { message: 'Invalid machine credentials' });
            return;
          }

          // Mark machine ONLINE and save mapping
          await prisma.machine.update({
            where: { id: machine.id },
            data: { status: 'ONLINE' },
          });

          this.agentSockets.set(machineCode, socket.id);
          socket.join(`machine:${machineCode}`);
          socket.data.machineCode = machineCode;
          socket.data.isAgent = true;

          console.log(`[Socket Agent Auth Success] Machine ${machineCode} is now connected & ONLINE.`);
          socket.emit('agent:authenticated', { success: true, machineCode });
          
          // Broadcast machine status update
          this.io.emit('machine:status-change', { machineCode, status: 'ONLINE' });
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

          // Update DB record
          const updatedJob = await prisma.printJob.update({
            where: { id: jobId },
            data: { status },
          });

          // Notify subscribed clients
          console.log(`[Backend -> Frontend] Emitting job:updated for ${jobId} -> Status: ${status}`);
          this.io.to(`job:${jobId}`).emit('job:updated', {
            jobId,
            status,
            errorMessage,
            updatedAt: updatedJob.updatedAt,
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

      // Disconnect handling
      socket.on('disconnect', async () => {
        const machineCode = socket.data.machineCode;
        if (socket.data.isAgent && machineCode) {
          console.log(`[Socket Agent Disconnected] Machine ${machineCode} went OFFLINE.`);
          this.agentSockets.delete(machineCode);
          try {
            await prisma.machine.update({
              where: { machineCode },
              data: { status: 'OFFLINE' },
            });
            this.io.emit('machine:status-change', { machineCode, status: 'OFFLINE' });
          } catch (e) {
            console.error('[Socket Disconnect DB Update Error]', e);
          }
        }
      });
    });
  }

  // Method to dispatch job to connected Print Agent
  public dispatchJobToAgent(machineCode: string, jobData: any): boolean {
    const normalizedCode = (machineCode || '').trim();

    let socketId = this.agentSockets.get(normalizedCode);
    if (!socketId) {
      for (const [code, id] of this.agentSockets.entries()) {
        if (code.toUpperCase() === normalizedCode.toUpperCase()) {
          socketId = id;
          break;
        }
      }
    }

    if (!socketId) {
      console.warn(`[Socket Dispatch Warning] No active agent socket for machine: ${machineCode}`);
      return false;
    }

    console.log(`[Socket] Emitting print job to machine:${machineCode}`);
    this.io.to(`machine:${machineCode}`).emit('print-job:dispatch', jobData);
    console.log(`[Socket Dispatch Success] Dispatched job ${jobData.id} to machine ${machineCode}`);
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

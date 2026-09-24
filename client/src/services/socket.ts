import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketBackendUrl = (): string => {
  const rawUrl =
    ((import.meta as any).env?.VITE_API_URL as string) ||
    ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
    '';
  if (rawUrl) {
    return rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  return 'http://localhost:5000';
};

export const getSocket = (): Socket => {
  if (!socket) {
    const backendUrl = getSocketBackendUrl();
    console.log(`[Frontend Socket] Initializing Socket.IO connection to backend: ${backendUrl}`);
    socket = io(backendUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log(`[Frontend Socket ✅] Connected to backend server (Socket ID: ${socket?.id})`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Frontend Socket ⚠️] Disconnected: ${reason}`);
    });
  }
  return socket;
};

export const subscribeToJobUpdates = (
  jobId: string,
  onUpdate: (data: { status: string; errorMessage?: string }) => void
) => {
  const s = getSocket();
  console.log(`[Frontend Socket] Subscribing to updates for job: ${jobId}`);
  s.emit('job:subscribe', jobId);
  
  const handler = (data: { jobId: string; status: string; errorMessage?: string }) => {
    if (data.jobId === jobId) {
      console.log(`[Frontend Received Status] Job ${data.jobId} -> Status: ${data.status}`);
      onUpdate({ status: data.status, errorMessage: data.errorMessage });
    }
  };

  s.on('job:updated', handler);

  return () => {
    console.log(`[Frontend Socket] Unsubscribing from updates for job: ${jobId}`);
    s.off('job:updated', handler);
  };
};

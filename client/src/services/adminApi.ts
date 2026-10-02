import axios from 'axios';

const getBaseUrl = (): string => {
  const rawUrl =
    ((import.meta as any).env?.VITE_API_URL as string) ||
    ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
    '';
  if (rawUrl) {
    const trimmed = rawUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return 'http://localhost:5000/api';
};

const adminAxios = axios.create({
  baseURL: getBaseUrl(),
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['x-admin-token'] = token;
  }
  return config;
});

export interface PaperRefill {
  id: string;
  machineId: string;
  quantityAdded: number;
  previousStock: number;
  newStock: number;
  adminEmail: string;
  createdAt: string;
}

export interface AdminMachine {
  id: string;
  machineCode: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  operationalState: 'ACTIVE' | 'DISABLED';
  token: string;
  paperStock: number;
  lowPaperThreshold: number;
  paperStatus: 'NORMAL' | 'LOW_PAPER' | 'OUT_OF_PAPER';
  createdAt: string;
  updatedAt: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  revenue: number;
  pagesPrinted: number;
  lastActivity: string;
  recentJobs?: any[];
  paperRefills?: PaperRefill[];
}

export interface AdminMachinesResponse {
  data: AdminMachine[];
  paperSummary?: {
    normalCount: number;
    lowPaperCount: number;
    outOfPaperCount: number;
  };
}

export const adminLogin = async (email: string, password: string) => {
  const res = await adminAxios.post('/admin/login', { email, password });
  if (res.data?.data?.token) {
    localStorage.setItem('adminToken', res.data.data.token);
  }
  return res.data;
};

export const getAdminMachines = async (): Promise<AdminMachinesResponse> => {
  const res = await adminAxios.get('/admin/machines');
  return {
    data: res.data.data,
    paperSummary: res.data.paperSummary,
  };
};

export const getAdminMachineById = async (id: string): Promise<AdminMachine> => {
  const res = await adminAxios.get(`/admin/machines/${id}`);
  return res.data.data;
};

export const createAdminMachine = async (data: {
  machineCode: string;
  name: string;
  location: string;
}): Promise<AdminMachine> => {
  const res = await adminAxios.post('/admin/machines', data);
  return res.data.data;
};

export const updateAdminMachine = async (
  id: string,
  data: { name?: string; location?: string }
): Promise<AdminMachine> => {
  const res = await adminAxios.patch(`/admin/machines/${id}`, data);
  return res.data.data;
};

export const disableAdminMachine = async (id: string): Promise<AdminMachine> => {
  const res = await adminAxios.patch(`/admin/machines/${id}/disable`);
  return res.data.data;
};

export const enableAdminMachine = async (id: string): Promise<AdminMachine> => {
  const res = await adminAxios.patch(`/admin/machines/${id}/enable`);
  return res.data.data;
};

export const addAdminMachinePaper = async (
  id: string,
  quantity: number
): Promise<{ machine: AdminMachine; message: string }> => {
  const res = await adminAxios.post(`/admin/machines/${id}/add-paper`, { quantity });
  return {
    machine: res.data.data,
    message: res.data.message,
  };
};

export const updateAdminMachineThreshold = async (
  id: string,
  lowPaperThreshold: number
): Promise<AdminMachine> => {
  const res = await adminAxios.patch(`/admin/machines/${id}/threshold`, { lowPaperThreshold });
  return res.data.data;
};

export const getAdminMachineRefillHistory = async (id: string): Promise<PaperRefill[]> => {
  const res = await adminAxios.get(`/admin/machines/${id}/refills`);
  return res.data.data;
};

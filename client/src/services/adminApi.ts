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
  const token = localStorage.getItem('adminToken') || 'leopardx_admin_secret_token_2026';
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  return config;
});

export interface AdminMachine {
  id: string;
  machineCode: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  operationalState: 'ACTIVE' | 'DISABLED';
  token: string;
  createdAt: string;
  updatedAt: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  revenue: number;
  pagesPrinted: number;
  lastActivity: string;
  recentJobs?: any[];
}

export const adminLogin = async (passcode: string) => {
  const res = await adminAxios.post('/admin/login', { passcode });
  if (res.data?.data?.token) {
    localStorage.setItem('adminToken', res.data.data.token);
  }
  return res.data;
};

export const getAdminMachines = async (): Promise<AdminMachine[]> => {
  const res = await adminAxios.get('/admin/machines');
  return res.data.data;
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

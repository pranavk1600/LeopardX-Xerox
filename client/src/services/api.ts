import axios from 'axios';
import { KioskMachine, UploadedPdfInfo, PrintOptions, PriceSummary, PrintJob } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const getMachineByCode = async (machineCode: string): Promise<KioskMachine> => {
  const response = await api.get(`/machines/${machineCode}`);
  return response.data.data;
};

export const uploadPdfDocument = async (file: File): Promise<UploadedPdfInfo> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/print-jobs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const calculatePrice = async (
  totalPages: number,
  options: PrintOptions
): Promise<PriceSummary> => {
  const response = await api.post('/print-jobs/calculate-price', {
    totalPages,
    ...options,
  });
  return response.data.data;
};

export const createPrintJob = async (
  machineCode: string,
  fileName: string,
  totalPages: number,
  options: PrintOptions
): Promise<PrintJob> => {
  const response = await api.post('/print-jobs', {
    machineCode,
    fileName,
    totalPages,
    ...options,
  });
  return response.data.data;
};

export const getPrintJobStatus = async (jobId: string): Promise<PrintJob> => {
  const response = await api.get(`/print-jobs/${jobId}`);
  return response.data.data;
};

export const createPaymentOrder = async (
  printJobId: string,
  gateway: string = 'CASHFREE'
): Promise<{
  paymentId: string;
  orderId: string;
  paymentSessionId: string;
  amount: number;
  gatewayData?: {
    environment?: string;
    orderStatus?: string;
    orderAmount?: number;
  };
}> => {
  const response = await api.post('/payments/create-order', {
    printJobId,
    gateway,
  });
  return response.data.data;
};

export const verifyPaymentStatus = async (
  printJobId: string,
  orderId: string,
  paymentId?: string
): Promise<{ jobId: string; status: string }> => {
  const response = await api.post('/payments/verify', {
    printJobId,
    orderId,
    paymentId,
  });
  return response.data.data;
};

export const triggerDirectPrint = async (jobId: string): Promise<PrintJob> => {
  const response = await api.post(`/print-jobs/${jobId}/direct-print`);
  return response.data.data;
};

export default api;

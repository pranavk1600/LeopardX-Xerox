export type ColorMode = 'BW' | 'COLOR';
export type PaperSize = 'A4' | 'A3';

export type MachineStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface KioskMachine {
  id: string;
  machineCode: string;
  name: string;
  location: string;
  status: MachineStatus;
}

export interface UploadedPdfInfo {
  fileName: string;
  fileUrl: string;
  originalName: string;
  size: number;
  totalPages: number;
}

export interface PrintOptions {
  selectedPages: string; // 'all' or '1-5, 8'
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
}

export interface PriceSummary {
  pagesToPrint: number;
  pricePerPage: number;
  basePrice: number;
  totalPrice: number;
  copies: number;
}

export type PrintJobStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'QUEUED'
  | 'PRINTING'
  | 'COMPLETED'
  | 'FAILED';

export interface PrintJob {
  id: string;
  machineId: string;
  fileName: string;
  fileUrl: string;
  totalPages: number;
  selectedPages: string;
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  price: number;
  status: PrintJobStatus;
  createdAt: string;
  updatedAt: string;
}

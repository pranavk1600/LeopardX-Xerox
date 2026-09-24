export interface PrintOptions {
  copies: number;
  selectedPages?: string; // "all" or "1-5, 8"
  colorMode: 'BW' | 'COLOR';
  paperSize: 'A4' | 'A3';
  printerName?: string;
}

export interface PrinterStatus {
  isReady: boolean;
  statusText: string;
  printersAvailable: string[];
}

export interface IPrinterService {
  getPrinters(): Promise<string[]>;
  printDocument(filePath: string, options: PrintOptions): Promise<boolean>;
  getPrinterStatus(printerName?: string): Promise<PrinterStatus>;
  cancelPrint(jobId?: string): Promise<boolean>;
}

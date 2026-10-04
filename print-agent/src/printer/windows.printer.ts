import { IPrinterService, PrintOptions, PrinterStatus } from './printer.interface';
import { print, getPrinters } from 'pdf-to-printer';
import fs from 'fs';

export class WindowsPrinterService implements IPrinterService {
  async getPrinters(): Promise<string[]> {
    try {
      const list = await getPrinters();
      return list.map((p) => p.name);
    } catch (error) {
      console.warn('[WindowsPrinterService] Unable to list printers via pdf-to-printer:', error);
      return [];
    }
  }

  async getPrinterStatus(printerName?: string): Promise<PrinterStatus> {
    const printers = await this.getPrinters();
    return {
      isReady: printers.length > 0,
      statusText: printers.length > 0 ? 'Printer service ready' : 'No printers detected',
      printersAvailable: printers,
    };
  }

  async printDocument(filePath: string, options: PrintOptions): Promise<boolean> {
    console.log(`[WindowsPrinterService] Initiating print job for file: ${filePath}`);
    console.log(`[WindowsPrinterService] Print Options:`, options);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const printConfig: any = {
      copies: options.copies || 1,
    };

    if (options.printerName && options.printerName.trim() !== '') {
      printConfig.printer = options.printerName.trim();
    }

    if (options.selectedPages && options.selectedPages.toLowerCase() !== 'all') {
      printConfig.pages = options.selectedPages;
    }

    if (options.paperSize) {
      printConfig.paperSize = options.paperSize.toLowerCase();
    }

    if (options.printType === 'BACK_TO_BACK') {
      printConfig.side = 'duplex';
    } else {
      printConfig.side = 'simplex';
    }

    console.log(`[WindowsPrinterService] Sending job to Windows print spooler... Config:`, printConfig);
    await print(filePath, printConfig);
    console.log(`[WindowsPrinterService ✅] Print job sent to printer successfully.`);
    return true;
  }

  async cancelPrint(jobId?: string): Promise<boolean> {
    console.log(`[WindowsPrinterService] Cancel print requested for job: ${jobId || 'current'}`);
    return true;
  }
}

export const printerService = new WindowsPrinterService();


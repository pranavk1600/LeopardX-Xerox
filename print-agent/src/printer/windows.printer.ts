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
      copies: Math.max(1, options.copies || 1),
    };

    if (options.printerName && options.printerName.trim() !== '') {
      printConfig.printer = options.printerName.trim();
    }

    if (options.selectedPages && options.selectedPages.toLowerCase() !== 'all') {
      printConfig.pages = options.selectedPages;
    }

    // Only pass paperSize if non-default (e.g. A3) paper size is requested
    if (options.paperSize && options.paperSize.toUpperCase() !== 'A4') {
      printConfig.paperSize = options.paperSize.toUpperCase();
    }

    // Only pass side if BACK_TO_BACK (duplex) is explicitly requested
    if (options.printType === 'BACK_TO_BACK') {
      printConfig.side = 'duplex';
    }

    const isDryRun = options.dryRun || process.env.PRINT_DRY_RUN === 'true';

    if (isDryRun) {
      console.log(`[DRY RUN] Would print job ${options.jobId || 'unknown'}`);
      console.log(`[DRY RUN] copies=${printConfig.copies}`);
      console.log(`[DRY RUN] printer=${printConfig.printer || 'default'}`);
      console.log(`[DRY RUN] paperSize=${printConfig.paperSize}`);
      console.log(`[DRY RUN] side=${printConfig.side}`);
      console.log(`[DRY RUN] (No physical print sent to printer hardware)`);
      return true;
    }

    console.log(`[PHYSICAL PRINT INVOCATION]`);
    console.log(`jobId=${options.jobId || 'unknown'}`);
    console.log(`copies=${printConfig.copies}`);
    console.log(`printer=${printConfig.printer || 'default'}`);
    console.log(`timestamp=${new Date().toISOString()}`);

    console.log(`[WindowsPrinterService] Sending job to Windows print spooler... Config:`, printConfig);
    await print(filePath, printConfig);

    console.log(`[PHYSICAL PRINT RETURNED]`);
    console.log(`jobId=${options.jobId || 'unknown'}`);
    console.log(`timestamp=${new Date().toISOString()}`);
    console.log(`[WindowsPrinterService] Print job sent to printer successfully.`);
    return true;
  }

  async cancelPrint(jobId?: string): Promise<boolean> {
    console.log(`[WindowsPrinterService] Cancel print requested for job: ${jobId || 'current'}`);
    return true;
  }
}

export const printerService = new WindowsPrinterService();


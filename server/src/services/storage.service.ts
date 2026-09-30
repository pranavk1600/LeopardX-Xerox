import fs from 'fs';
import path from 'path';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.FILE_STORAGE_PATH || './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public getFilePath(fileName: string): string {
    return path.join(this.uploadDir, path.basename(fileName));
  }

  public fileExists(fileName: string): boolean {
    return fs.existsSync(this.getFilePath(fileName));
  }

  public validatePdfHeader(filePath: string): boolean {
    try {
      const buffer = Buffer.alloc(5);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      return buffer.toString('utf-8') === '%PDF-';
    } catch {
      return false;
    }
  }

  public deleteFile(fileName: string): void {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Securely deletes temporary PDF after print job reaches COMPLETED status.
   */
  public deleteTemporaryPdf(fileName: string): boolean {
    try {
      const sanitizedFileName = path.basename(fileName);
      const targetPath = path.resolve(this.uploadDir, sanitizedFileName);

      // Security: Prevent path traversal outside storage directory
      if (!targetPath.startsWith(this.uploadDir)) {
        console.warn(`[PDF Cleanup Security Warning] Invalid file path attempt: ${fileName}`);
        return false;
      }

      console.log(`[PDF Cleanup] Deleting temporary PDF: ${sanitizedFileName}`);

      if (!fs.existsSync(targetPath)) {
        console.warn(`[PDF Cleanup] PDF already missing: ${sanitizedFileName}`);
        return false;
      }

      fs.unlinkSync(targetPath);
      console.log(`[PDF Cleanup] PDF deleted successfully`);
      return true;
    } catch (err: any) {
      console.error(`[PDF Cleanup Error] Failed to delete file ${fileName}:`, err?.message || err);
      return false;
    }
  }
}

export const storageService = new StorageService();

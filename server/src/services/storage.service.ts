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
    return path.join(this.uploadDir, fileName);
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
}

export const storageService = new StorageService();

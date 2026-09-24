import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class FileDownloaderService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.resolve(__dirname, '../../temp_downloads');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async downloadFile(backendUrl: string, fileUrl: string, fileName: string): Promise<string> {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${backendUrl}${fileUrl}`;
    const destinationPath = path.join(this.tempDir, fileName);

    console.log(`[Downloader] Downloading document from: ${fullUrl}`);

    const response = await axios({
      method: 'GET',
      url: fullUrl,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(destinationPath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', () => {
        console.log(`[Downloader] File saved locally to: ${destinationPath}`);
        resolve(destinationPath);
      });
      writer.on('error', (err) => {
        console.error('[Downloader Error]', err);
        reject(err);
      });
    });
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Downloader Cleanup] Removed temp file: ${filePath}`);
      }
    } catch (e) {
      console.warn(`[Downloader Cleanup Error] Failed to remove ${filePath}`, e);
    }
  }
}

export const fileDownloaderService = new FileDownloaderService();

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { prisma } from '../config/prisma';
import { storageService } from '../services/storage.service';
import { pricingService } from '../services/pricing.service';
import { socketManagerInstance } from '../sockets/socket.manager';
import { ColorMode, PaperSize, PrintType } from '@prisma/client';

function extractPdfPageCountFallback(dataBuffer: Buffer): number {
  try {
    const binaryStr = dataBuffer.toString('binary');
    const pageMatches = binaryStr.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
    const countMatches = binaryStr.match(/\/Count\s+(\d+)\b/g);
    if (countMatches && countMatches.length > 0) {
      const counts = countMatches
        .map((m) => parseInt(m.replace(/[^\d]/g, ''), 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (counts.length > 0) {
        return Math.max(...counts);
      }
    }
  } catch (err) {
    console.warn('[PDF Fallback Extraction Warning]', err);
  }
  return 0;
}

export const uploadPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded or invalid file format. Please upload a PDF file.' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    if (!storageService.validatePdfHeader(filePath)) {
      storageService.deleteFile(fileName);
      res.status(400).json({ success: false, message: 'Security validation failed: File is not a valid PDF document.' });
      return;
    }

    const dataBuffer = fs.readFileSync(filePath);
    let totalPages = 1;

    try {
      const pdfData = await pdfParse(dataBuffer);
      totalPages = pdfData.numpages || 1;
    } catch (parseErr: any) {
      console.warn(`[PDF Parse Warning] pdf-parse failed for ${fileName} (${parseErr?.message || parseErr}). Attempting fallback extraction...`);
      const fallbackPages = extractPdfPageCountFallback(dataBuffer);
      if (fallbackPages > 0) {
        console.log(`[PDF Parse Fallback Success] Determined ${fallbackPages} page(s) for ${fileName}`);
        totalPages = fallbackPages;
      } else {
        console.error(`[PDF Parse Error] Unable to determine page count for ${fileName}`);
        storageService.deleteFile(fileName);
        res.status(400).json({
          success: false,
          message: 'Unable to read PDF page count. Please select or re-upload the PDF document.',
        });
        return;
      }
    }

    const fileUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      data: {
        fileName,
        fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        totalPages,
      },
    });
  } catch (error) {
    if (req.file?.filename) {
      storageService.deleteFile(req.file.filename);
    }
    next(error);
  }
};

export const calculatePrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { totalPages, selectedPages, copies, colorMode, paperSize, printType } = req.body;

    if (!totalPages || totalPages <= 0) {
      res.status(400).json({ success: false, message: 'Invalid total pages' });
      return;
    }

    const calcResult = pricingService.calculatePrice({
      totalPages: Number(totalPages),
      selectedPages: selectedPages || 'all',
      copies: Number(copies) || 1,
      colorMode: colorMode === 'COLOR' ? ColorMode.COLOR : ColorMode.BW,
      paperSize: paperSize === 'A3' ? PaperSize.A3 : PaperSize.A4,
      printType: printType === 'BACK_TO_BACK' ? PrintType.BACK_TO_BACK : PrintType.SINGLE_SIDE,
    });

    res.json({
      success: true,
      data: calcResult,
    });
  } catch (error) {
    next(error);
  }
};

export const createPrintJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineCode, fileName, totalPages, selectedPages, copies, colorMode, paperSize, printType } = req.body;

    if (!machineCode || !fileName || !totalPages) {
      res.status(400).json({ success: false, message: 'Missing required parameters (machineCode, fileName, totalPages)' });
      return;
    }

    const machine = await prisma.machine.findFirst({
      where: { machineCode: { equals: (machineCode as string).trim().toUpperCase(), mode: 'insensitive' } },
    });
    if (!machine) {
      res.status(404).json({ success: false, message: 'Target kiosk machine not found' });
      return;
    }

    const opState = (machine as any).operationalState || 'ACTIVE';
    if (opState === 'DISABLED') {
      res.status(403).json({ success: false, message: 'Printing is currently unavailable for this machine.' });
      return;
    }

    if (!storageService.fileExists(fileName)) {
      res.status(404).json({ success: false, message: 'Uploaded document file not found' });
      return;
    }

    const resolvedPrintType = printType === 'BACK_TO_BACK' ? PrintType.BACK_TO_BACK : PrintType.SINGLE_SIDE;

    const pricing = pricingService.calculatePrice({
      totalPages: Number(totalPages),
      selectedPages: selectedPages || 'all',
      copies: Number(copies) || 1,
      colorMode: colorMode === 'COLOR' ? ColorMode.COLOR : ColorMode.BW,
      paperSize: paperSize === 'A3' ? PaperSize.A3 : PaperSize.A4,
      printType: resolvedPrintType,
    });

    const fileUrl = `/uploads/${fileName}`;

    const printJob = await prisma.printJob.create({
      data: {
        machineId: machine.id,
        fileName,
        fileUrl,
        totalPages: Number(totalPages),
        selectedPages: selectedPages || 'all',
        copies: Number(copies) || 1,
        colorMode: colorMode === 'COLOR' ? ColorMode.COLOR : ColorMode.BW,
        paperSize: paperSize === 'A3' ? PaperSize.A3 : PaperSize.A4,
        printType: resolvedPrintType,
        price: pricing.totalPrice,
        status: 'CREATED',
      },
    });

    res.status(201).json({
      success: true,
      data: printJob,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrintJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const printJob = await prisma.printJob.findUnique({
      where: { id },
      include: { machine: true, payment: true },
    });

    if (!printJob) {
      res.status(404).json({ success: false, message: 'Print job not found' });
      return;
    }

    res.json({
      success: true,
      data: printJob,
    });
  } catch (error) {
    next(error);
  }
};

export const directPrintJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const printJob = await prisma.printJob.findUnique({
      where: { id },
      include: { machine: true },
    });

    if (!printJob) {
      res.status(404).json({ success: false, message: 'Print job not found' });
      return;
    }

    const updatedJob = await prisma.printJob.update({
      where: { id },
      data: { status: 'QUEUED' },
      include: { machine: true },
    });

    if (socketManagerInstance) {
      const dispatched = socketManagerInstance.dispatchJobToAgent(updatedJob.machine.machineCode, {
        id: updatedJob.id,
        fileName: updatedJob.fileName,
        fileUrl: updatedJob.fileUrl,
        selectedPages: updatedJob.selectedPages,
        copies: updatedJob.copies,
        colorMode: updatedJob.colorMode,
        paperSize: updatedJob.paperSize,
        printType: updatedJob.printType,
      });

      if (!dispatched) {
        await prisma.printJob.update({
          where: { id },
          data: { status: 'FAILED' },
        });
        res.status(503).json({
          success: false,
          message: 'Printer agent is currently offline. Unable to process print job.',
        });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Print job queued and sent to kiosk printer',
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

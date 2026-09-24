import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { prisma } from '../config/prisma';
import { storageService } from '../services/storage.service';
import { pricingService } from '../services/pricing.service';
import { socketManagerInstance } from '../sockets/socket.manager';
import { ColorMode, PaperSize } from '@prisma/client';

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
    const pdfData = await pdfParse(dataBuffer);
    const totalPages = pdfData.numpages || 1;

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
    const { totalPages, selectedPages, copies, colorMode, paperSize } = req.body;

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
    const { machineCode, fileName, totalPages, selectedPages, copies, colorMode, paperSize } = req.body;

    if (!machineCode || !fileName || !totalPages) {
      res.status(400).json({ success: false, message: 'Missing required parameters (machineCode, fileName, totalPages)' });
      return;
    }

    const machine = await prisma.machine.findUnique({ where: { machineCode: (machineCode as string).toUpperCase() } });
    if (!machine) {
      res.status(404).json({ success: false, message: 'Target kiosk machine not found' });
      return;
    }

    if (!storageService.fileExists(fileName)) {
      res.status(404).json({ success: false, message: 'Uploaded document file not found' });
      return;
    }

    const pricing = pricingService.calculatePrice({
      totalPages: Number(totalPages),
      selectedPages: selectedPages || 'all',
      copies: Number(copies) || 1,
      colorMode: colorMode === 'COLOR' ? ColorMode.COLOR : ColorMode.BW,
      paperSize: paperSize === 'A3' ? PaperSize.A3 : PaperSize.A4,
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

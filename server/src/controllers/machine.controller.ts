import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma';

export const getMachineByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machineCode = req.params.machineCode as string;

    if (!machineCode) {
      res.status(400).json({ success: false, message: 'Machine code is required' });
      return;
    }

    const machine = await prisma.machine.findUnique({
      where: { machineCode: machineCode.toUpperCase() },
      select: {
        id: true,
        machineCode: true,
        name: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    res.json({
      success: true,
      data: machine,
    });
  } catch (error) {
    next(error);
  }
};

export const registerMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineCode, name, location } = req.body;

    const code = (machineCode || 'PUNE-COLLEGE-001').toUpperCase();
    const kioskName = name || 'Pune College Kiosk #1';
    const kioskLocation = location || 'Main Library Ground Floor';

    // Generate secure 256-bit machine token
    const token = crypto.randomBytes(32).toString('hex');

    const machine = await prisma.machine.upsert({
      where: { machineCode: code },
      update: {
        name: kioskName,
        location: kioskLocation,
        token,
        status: 'ONLINE',
      },
      create: {
        machineCode: code,
        name: kioskName,
        location: kioskLocation,
        token,
        status: 'ONLINE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Machine registered successfully',
      data: {
        id: machine.id,
        machineCode: machine.machineCode,
        name: machine.name,
        location: machine.location,
        token: machine.token,
        status: machine.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    const machine = await prisma.machine.findFirst({
      where: {
        machineCode: {
          equals: machineCode.trim().toUpperCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        machineCode: true,
        name: true,
        location: true,
        status: true,
        operationalState: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const opState = (machine as any).operationalState || 'ACTIVE';
    if (opState === 'DISABLED') {
      res.status(403).json({
        success: false,
        message: 'Printing is currently unavailable for this machine.',
        disabled: true,
        data: {
          machineCode: machine.machineCode,
          name: machine.name,
          location: machine.location,
          status: machine.status,
          operationalState: 'DISABLED',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...machine,
        operationalState: opState,
      },
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
        operationalState: 'ACTIVE',
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
        operationalState: (machine as any).operationalState || 'ACTIVE',
      },
    });
  } catch (error) {
    next(error);
  }
};

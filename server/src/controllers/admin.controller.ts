import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'leopardx_admin_secret_token_2026';

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { passcode, username, password } = req.body;
    const providedPass = passcode || password || username;

    if (!providedPass) {
      res.status(400).json({ success: false, message: 'Passcode is required' });
      return;
    }

    if (providedPass !== ADMIN_PASSCODE && providedPass !== ADMIN_TOKEN) {
      res.status(401).json({ success: false, message: 'Invalid Admin passcode' });
      return;
    }

    res.json({
      success: true,
      message: 'Super Admin authenticated successfully',
      data: {
        token: ADMIN_TOKEN,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMachines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machines = await prisma.machine.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        printJobs: {
          select: {
            id: true,
            status: true,
            price: true,
            totalPages: true,
            createdAt: true,
          },
        },
      },
    });

    const formattedMachines = machines.map((m) => {
      const completedJobs = m.printJobs.filter((j) => j.status === 'COMPLETED');
      const failedJobs = m.printJobs.filter((j) => j.status === 'FAILED');
      const revenue = Number(completedJobs.reduce((acc, j) => acc + (j.price || 0), 0).toFixed(2));
      const pagesPrinted = completedJobs.reduce((acc, j) => acc + (j.totalPages || 0), 0);
      
      const lastJob = m.printJobs.length > 0
        ? m.printJobs.reduce((latest, j) => (j.createdAt > latest ? j.createdAt : latest), m.printJobs[0].createdAt)
        : m.updatedAt;

      return {
        id: m.id,
        machineCode: m.machineCode,
        name: m.name,
        location: m.location,
        status: m.status,
        operationalState: (m as any).operationalState || 'ACTIVE',
        token: m.token,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        totalJobs: m.printJobs.length,
        successfulJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        revenue,
        pagesPrinted,
        lastActivity: lastJob,
      };
    });

    res.json({
      success: true,
      data: formattedMachines,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const machine = await prisma.machine.findFirst({
      where: {
        OR: [{ id }, { machineCode: id.toUpperCase() }],
      },
      include: {
        printJobs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { payment: true },
        },
      },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const allJobs = await prisma.printJob.findMany({
      where: { machineId: machine.id },
      select: { status: true, price: true, totalPages: true, createdAt: true },
    });

    const completedJobs = allJobs.filter((j) => j.status === 'COMPLETED');
    const failedJobs = allJobs.filter((j) => j.status === 'FAILED');
    const revenue = Number(completedJobs.reduce((acc, j) => acc + (j.price || 0), 0).toFixed(2));
    const pagesPrinted = completedJobs.reduce((acc, j) => acc + (j.totalPages || 0), 0);

    const lastJob = allJobs.length > 0
      ? allJobs.reduce((latest, j) => (j.createdAt > latest ? j.createdAt : latest), allJobs[0].createdAt)
      : machine.updatedAt;

    res.json({
      success: true,
      data: {
        id: machine.id,
        machineCode: machine.machineCode,
        name: machine.name,
        location: machine.location,
        status: machine.status,
        operationalState: (machine as any).operationalState || 'ACTIVE',
        token: machine.token,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
        totalJobs: allJobs.length,
        successfulJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        revenue,
        pagesPrinted,
        lastActivity: lastJob,
        recentJobs: machine.printJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineCode, name, location } = req.body;

    if (!machineCode || !name || !location) {
      res.status(400).json({
        success: false,
        message: 'Machine Code, Machine Name, and Location are required',
      });
      return;
    }

    const code = machineCode.trim().toUpperCase();
    const kioskName = name.trim();
    const kioskLocation = location.trim();

    // Validate unique machineCode (Case-Insensitive)
    const existing = await prisma.machine.findFirst({
      where: {
        machineCode: {
          equals: code,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Machine Code "${code}" already exists. Please choose a unique Machine Code.`,
      });
      return;
    }

    // Generate secure 256-bit machine authentication token server-side
    const token = crypto.randomBytes(32).toString('hex');

    const newMachine = await prisma.machine.create({
      data: {
        machineCode: code,
        name: kioskName,
        location: kioskLocation,
        token,
        status: 'OFFLINE',
        operationalState: 'ACTIVE',
      },
    });

    console.log(`[Super Admin] Created new Machine: ${newMachine.name} (${newMachine.machineCode})`);

    res.status(201).json({
      success: true,
      message: 'Machine created successfully',
      data: {
        id: newMachine.id,
        machineCode: newMachine.machineCode,
        name: newMachine.name,
        location: newMachine.location,
        status: newMachine.status,
        operationalState: (newMachine as any).operationalState || 'ACTIVE',
        token: newMachine.token,
        createdAt: newMachine.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, location, machineCode } = req.body;

    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    // Reject casual modification of machineCode
    if (machineCode && machineCode.trim().toUpperCase() !== machine.machineCode) {
      res.status(400).json({
        success: false,
        message: 'Machine Code cannot be casually modified after creation as it is the public identifier linked to physical QR codes.',
      });
      return;
    }

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(location && { location: location.trim() }),
      },
    });

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const disableMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        operationalState: 'DISABLED',
      },
    });

    console.log(`[Super Admin] Disabled Machine: ${machine.machineCode}`);

    res.json({
      success: true,
      message: `Machine ${machine.machineCode} has been DISABLED. Customers cannot initiate new print jobs.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const enableMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        operationalState: 'ACTIVE',
      },
    });

    console.log(`[Super Admin] Enabled Machine: ${machine.machineCode}`);

    res.json({
      success: true,
      message: `Machine ${machine.machineCode} has been ACTIVATED. Customers can initiate new print jobs.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

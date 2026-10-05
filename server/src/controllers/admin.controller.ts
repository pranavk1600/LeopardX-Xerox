import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { emailService } from '../services/email.service';
import { socketManagerInstance } from '../sockets/socket.manager';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'leopardx_super_admin_jwt_secret_key_2026_secure';
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password } = req.body;
    const providedEmail = (email || username || '').trim().toLowerCase();

    if (!providedEmail || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const admin = await prisma.superAdmin.findUnique({
      where: { email: providedEmail },
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({ success: false, message: 'Invalid Super Admin credentials or inactive account' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid Super Admin credentials' });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Super Admin authenticated successfully',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const providedEmail = (email || '').trim().toLowerCase();

    if (!providedEmail) {
      res.status(400).json({ success: false, message: 'Email address is required' });
      return;
    }

    const genericSuccessResponse = {
      success: true,
      message: 'Password reset link has been sent to your email. Please check your inbox.',
    };

    const admin = await prisma.superAdmin.findUnique({
      where: { email: providedEmail },
    });

    if (!admin || !admin.isActive) {
      res.status(404).json({
        success: false,
        message: 'This email is not registered as a Super Admin.',
      });
      return;
    }

    // Generate 32-byte hex raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hash raw token using SHA-256 for DB storage
    const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // 15-minute token expiration
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: {
        resetTokenHash,
        resetTokenExpiresAt,
      },
    });

    // Send reset email via email service
    const emailSent = await emailService.sendPasswordResetEmail(admin.email, rawToken);

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
      return;
    }

    res.json(genericSuccessResponse);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword, password } = req.body;
    const rawToken = (token || '').trim();
    const targetPassword = newPassword || password;

    if (!rawToken || !targetPassword) {
      res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
      return;
    }

    if (targetPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const admin = await prisma.superAdmin.findFirst({
      where: {
        resetTokenHash: hashedToken,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!admin || !admin.isActive) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new password reset.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(targetPassword, 10);

    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
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

      const paperStatus = m.paperStock === 0
        ? 'OUT_OF_PAPER'
        : m.paperStock <= m.lowPaperThreshold
        ? 'LOW_PAPER'
        : 'NORMAL';

      const liveStatus = socketManagerInstance
        ? (socketManagerInstance.isAgentConnected(m.machineCode) ? 'ONLINE' : 'OFFLINE')
        : m.status;

      return {
        id: m.id,
        machineCode: m.machineCode,
        name: m.name,
        location: m.location,
        status: liveStatus,
        operationalState: (m as any).operationalState || 'ACTIVE',
        token: m.token,
        paperStock: m.paperStock,
        lowPaperThreshold: m.lowPaperThreshold,
        paperStatus,
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

    const paperSummary = {
      normalCount: formattedMachines.filter((m) => m.paperStatus === 'NORMAL').length,
      lowPaperCount: formattedMachines.filter((m) => m.paperStatus === 'LOW_PAPER').length,
      outOfPaperCount: formattedMachines.filter((m) => m.paperStatus === 'OUT_OF_PAPER').length,
    };

    res.json({
      success: true,
      data: formattedMachines,
      paperSummary,
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
        paperRefills: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        printJobs: {
          where: {
            payment: {
              status: 'SUCCESS',
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
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

    const paperStatus = machine.paperStock === 0
      ? 'OUT_OF_PAPER'
      : machine.paperStock <= machine.lowPaperThreshold
      ? 'LOW_PAPER'
      : 'NORMAL';

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
        paperStock: machine.paperStock,
        lowPaperThreshold: machine.lowPaperThreshold,
        paperStatus,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
        totalJobs: allJobs.length,
        successfulJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        revenue,
        pagesPrinted,
        lastActivity: lastJob,
        paperRefills: machine.paperRefills,
        recentJobs: machine.printJobs.map((j) => {
          const paymentTimestamp = j.payment?.updatedAt || j.payment?.createdAt || j.createdAt;
          return {
            id: j.id,
            totalPages: j.totalPages,
            price: j.price,
            status: j.status,
            paymentStatus: j.payment?.status || 'SUCCESS',
            paymentId: j.payment?.paymentId || null,
            paymentDate: paymentTimestamp.toISOString(),
            createdAt: paymentTimestamp.toISOString(),
          };
        }),
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

export const addPaperStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { quantity } = req.body;
    const addSheets = parseInt(quantity, 10);

    if (isNaN(addSheets) || addSheets <= 0) {
      res.status(400).json({ success: false, message: 'Please enter a valid positive number of paper sheets to add.' });
      return;
    }

    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const previousStock = machine.paperStock;
    const newStock = previousStock + addSheets;
    const adminEmail = (req as any).admin?.email || 'kondhalkarp1600@gmail.com';

    const [updatedMachine, refillLog] = await prisma.$transaction([
      prisma.machine.update({
        where: { id: machine.id },
        data: { paperStock: newStock },
      }),
      prisma.paperRefill.create({
        data: {
          machineId: machine.id,
          quantityAdded: addSheets,
          previousStock,
          newStock,
          adminEmail,
        },
      }),
    ]);

    console.log(`[Super Admin] Added ${addSheets} sheets to Machine ${machine.machineCode}. Stock: ${previousStock} -> ${newStock}`);

    res.json({
      success: true,
      message: `${addSheets} sheets added successfully.`,
      data: {
        id: updatedMachine.id,
        machineCode: updatedMachine.machineCode,
        paperStock: updatedMachine.paperStock,
        lowPaperThreshold: updatedMachine.lowPaperThreshold,
        paperStatus: updatedMachine.paperStock === 0 ? 'OUT_OF_PAPER' : updatedMachine.paperStock <= updatedMachine.lowPaperThreshold ? 'LOW_PAPER' : 'NORMAL',
        refillLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaperThreshold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { lowPaperThreshold } = req.body;
    const threshold = parseInt(lowPaperThreshold, 10);

    if (isNaN(threshold) || threshold < 0) {
      res.status(400).json({ success: false, message: 'Please enter a valid low paper threshold.' });
      return;
    }

    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const updatedMachine = await prisma.machine.update({
      where: { id: machine.id },
      data: { lowPaperThreshold: threshold },
    });

    res.json({
      success: true,
      message: `Low paper threshold updated to ${threshold} sheets.`,
      data: updatedMachine,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaperRefillHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineCode: id.toUpperCase() }] },
    });

    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    const refills = await prisma.paperRefill.findMany({
      where: { machineId: machine.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: refills,
    });
  } catch (error) {
    next(error);
  }
};


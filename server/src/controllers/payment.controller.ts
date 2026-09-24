import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { paymentGatewayService } from '../services/payment.service';
import { pricingService } from '../services/pricing.service';
import { cashfreeService } from '../services/cashfree.service';
import { socketManagerInstance } from '../sockets/socket.manager';
import { PaymentGateway, ColorMode, PaperSize } from '@prisma/client';

export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { printJobId, gateway = 'CASHFREE' } = req.body;

    if (!printJobId) {
      res.status(400).json({ success: false, message: 'printJobId is required' });
      return;
    }

    const printJob = await prisma.printJob.findUnique({
      where: { id: printJobId },
      include: { machine: true },
    });

    if (!printJob) {
      res.status(404).json({ success: false, message: 'Print job not found' });
      return;
    }

    // Authoritative Server-side Price Verification
    const calculatedPricing = pricingService.calculatePrice({
      totalPages: printJob.totalPages,
      selectedPages: printJob.selectedPages,
      copies: printJob.copies,
      colorMode: printJob.colorMode,
      paperSize: printJob.paperSize,
    });

    const finalAmount = calculatedPricing.totalPrice;

    const provider = paymentGatewayService.getProvider(gateway as PaymentGateway);
    const order = await provider.createOrder(printJob.id, finalAmount);

    const payment = await prisma.payment.upsert({
      where: { printJobId: printJob.id },
      update: {
        gateway: gateway as PaymentGateway,
        orderId: order.orderId,
        amount: finalAmount,
        status: 'PENDING',
      },
      create: {
        printJobId: printJob.id,
        gateway: gateway as PaymentGateway,
        orderId: order.orderId,
        amount: finalAmount,
        status: 'PENDING',
      },
    });

    await prisma.printJob.update({
      where: { id: printJob.id },
      data: {
        price: finalAmount,
        status: 'PAYMENT_PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        paymentSessionId: order.paymentSessionId,
        amount: payment.amount,
        gatewayData: order.gatewayData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { printJobId, orderId, paymentId } = req.body;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { printJobId: printJobId || undefined },
          { orderId: orderId || undefined },
        ],
      },
      include: { printJob: { include: { machine: true } } },
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const provider = paymentGatewayService.getProvider(payment.gateway);
    const verification = await provider.verifyPayment(payment.orderId, paymentId);

    if (!verification.success) {
      console.warn(`[Payment Warning] Verification failed for Order ID: ${payment.orderId}`);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      await prisma.printJob.update({
        where: { id: payment.printJobId },
        data: { status: 'FAILED' },
      });
      res.status(400).json({
        success: false,
        message: 'Payment verification failed or payment is pending/cancelled',
        rawStatus: verification.rawStatus,
      });
      return;
    }

    // SERVER-SIDE VERIFIED SUCCESS
    console.log(`[Payment] Payment verified successfully`);
    console.log(`[Print Job] Job ID: ${payment.printJobId}`);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paymentId: verification.paymentId || paymentId || `pay_verified_${Date.now()}`,
      },
    });

    console.log(`[Print Job] Updating status: PAID`);
    await prisma.printJob.update({
      where: { id: payment.printJobId },
      data: { status: 'PAID' },
    });

    console.log(`[Print Job] Updating status: QUEUED`);
    const updatedJob = await prisma.printJob.update({
      where: { id: payment.printJobId },
      data: { status: 'QUEUED' },
    });

    const targetMachineCode = payment.printJob.machine.machineCode;
    console.log(`[Print Job] Machine: ${targetMachineCode}`);

    // Dispatch job to connected Print Agent
    if (socketManagerInstance) {
      console.log(`[Print Job] Dispatching job to Print Agent`);
      const dispatched = socketManagerInstance.dispatchJobToAgent(targetMachineCode, {
        id: updatedJob.id,
        fileName: updatedJob.fileName,
        fileUrl: updatedJob.fileUrl,
        selectedPages: updatedJob.selectedPages,
        copies: updatedJob.copies,
        colorMode: updatedJob.colorMode,
        paperSize: updatedJob.paperSize,
      });

      if (!dispatched) {
        console.warn(`[Print Job Warning] Print Agent for machine ${targetMachineCode} is offline.`);
        await prisma.printJob.update({
          where: { id: updatedJob.id },
          data: { status: 'FAILED' },
        });
        res.status(503).json({
          success: false,
          message: 'Printer agent is currently offline. Unable to dispatch print job.',
        });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and print job queued',
      data: { jobId: updatedJob.id, status: updatedJob.status },
    });
  } catch (error) {
    console.error('[Payment Verification Error]', error);
    next(error);
  }
};

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { orderId: orderId as string },
      include: { printJob: true },
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        printJobStatus: payment.printJob.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-webhook-signature'] as string) || '';
    const timestamp = (req.headers['x-webhook-timestamp'] as string) || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValidSignature = cashfreeService.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!isValidSignature) {
      console.warn('[Webhook Warning] Invalid signature received');
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    const payload = req.body;
    const orderId = payload?.data?.order?.order_id || payload?.order_id;
    const paymentStatus = payload?.data?.payment?.payment_status || payload?.payment_status;
    const cfPaymentId = payload?.data?.payment?.cf_payment_id || payload?.cf_payment_id;

    if (!orderId) {
      res.status(400).json({ success: false, message: 'Missing order_id in webhook payload' });
      return;
    }

    console.log(`[Webhook Received] Order: ${orderId}, Status: ${paymentStatus}`);

    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: { printJob: { include: { machine: true } } },
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    // Idempotency: if already processed, return 200 OK
    if (payment.status === 'SUCCESS') {
      res.json({ success: true, message: 'Webhook already processed' });
      return;
    }

    if (paymentStatus === 'SUCCESS') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paymentId: String(cfPaymentId || `cf_pay_wh_${Date.now()}`),
        },
      });

      const updatedJob = await prisma.printJob.update({
        where: { id: payment.printJobId },
        data: { status: 'QUEUED' },
      });

      if (socketManagerInstance) {
        socketManagerInstance.dispatchJobToAgent(payment.printJob.machine.machineCode, {
          id: updatedJob.id,
          fileName: updatedJob.fileName,
          fileUrl: updatedJob.fileUrl,
          selectedPages: updatedJob.selectedPages,
          copies: updatedJob.copies,
          colorMode: updatedJob.colorMode,
          paperSize: updatedJob.paperSize,
        });
      }
    } else if (paymentStatus === 'FAILED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      await prisma.printJob.update({
        where: { id: payment.printJobId },
        data: { status: 'FAILED' },
      });
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    next(error);
  }
};

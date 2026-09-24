import { PaymentGatewayProvider } from '../types';
import { cashfreeService } from './cashfree.service';

export class CashfreeGateway implements PaymentGatewayProvider {
  async createOrder(jobId: string, amount: number, returnUrl?: string) {
    const res = await cashfreeService.createOrder(jobId, amount, returnUrl);
    return {
      orderId: res.orderId,
      paymentSessionId: res.paymentSessionId,
      gatewayData: {
        orderStatus: res.orderStatus,
        orderAmount: res.orderAmount,
        environment: process.env.CASHFREE_ENV || 'TEST',
      },
    };
  }

  async verifyPayment(orderId: string, paymentId?: string, signature?: string) {
    const res = await cashfreeService.verifyOrderStatus(orderId);
    return {
      success: res.success,
      paymentId: res.paymentId || paymentId,
      rawStatus: res.orderStatus,
    };
  }
}

export class PaymentGatewayService {
  private cashfree: CashfreeGateway;

  constructor() {
    this.cashfree = new CashfreeGateway();
  }

  public getProvider(gateway: 'CASHFREE' | 'RAZORPAY'): PaymentGatewayProvider {
    if (gateway === 'CASHFREE') {
      return this.cashfree;
    }
    throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
}

export const paymentGatewayService = new PaymentGatewayService();

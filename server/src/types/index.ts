import { ColorMode, PaperSize, PaymentGateway } from '@prisma/client';

export interface PriceCalculationParams {
  totalPages: number;
  selectedPages: string; // "all" or "1-5, 8"
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
}

export interface PriceCalculationResult {
  pagesToPrint: number;
  pricePerPage: number;
  basePrice: number;
  totalPrice: number;
  copies: number;
}

export interface PaymentGatewayProvider {
  createOrder(jobId: string, amount: number): Promise<{ orderId: string; paymentSessionId?: string; gatewayData?: any }>;
  verifyPayment(orderId: string, paymentId?: string, signature?: string): Promise<{ success: boolean; paymentId?: string; rawStatus?: string }>;
}

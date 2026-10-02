import { ColorMode, PaperSize, PrintType } from '@prisma/client';
import { PriceCalculationParams, PriceCalculationResult } from '../types';

export class PricingService {
  private bwPricePerPage = 2.0; // ₹2.00 per page for Single Side Black & White
  private backToBackPricePerPage = 4.0; // ₹4.00 per page for Back to Back
  private colorPricePerPage = 10.0; // ₹10.00 per page for Color

  public parseSelectedPageCount(totalPages: number, selectedPages: string): number {
    if (!selectedPages || selectedPages.trim().toLowerCase() === 'all') {
      return totalPages;
    }

    const pagesSet = new Set<number>();
    const parts = selectedPages.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
          for (let p = start; p <= Math.min(end, totalPages); p++) {
            pagesSet.add(p);
          }
        }
      } else {
        const pageNum = parseInt(trimmed, 10);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
          pagesSet.add(pageNum);
        }
      }
    }

    return pagesSet.size > 0 ? pagesSet.size : totalPages;
  }

  public calculatePrice(params: PriceCalculationParams): PriceCalculationResult {
    const pagesToPrint = this.parseSelectedPageCount(params.totalPages, params.selectedPages);
    
    let pricePerPage = (params.printType === PrintType.BACK_TO_BACK || (params.printType as string) === 'BACK_TO_BACK')
      ? this.backToBackPricePerPage
      : (params.colorMode === ColorMode.COLOR ? this.colorPricePerPage : this.bwPricePerPage);

    if (params.paperSize === PaperSize.A3) {
      pricePerPage *= 2.0; // A3 is double rate
    }

    const copies = Math.max(1, params.copies || 1);
    const basePrice = pagesToPrint * pricePerPage;
    const totalPrice = Number((basePrice * copies).toFixed(2));

    return {
      pagesToPrint,
      pricePerPage,
      basePrice,
      totalPrice,
      copies,
    };
  }

  public calculatePhysicalSheets(params: {
    totalPages: number;
    selectedPages?: string;
    copies?: number;
    printType?: PrintType | string;
  }): number {
    const pagesToPrint = this.parseSelectedPageCount(params.totalPages, params.selectedPages || 'all');
    const copies = Math.max(1, params.copies || 1);
    const isBackToBack = params.printType === PrintType.BACK_TO_BACK || (params.printType as string) === 'BACK_TO_BACK';

    const sheetsPerCopy = isBackToBack ? Math.ceil(pagesToPrint / 2) : pagesToPrint;
    return sheetsPerCopy * copies;
  }
}

export const pricingService = new PricingService();

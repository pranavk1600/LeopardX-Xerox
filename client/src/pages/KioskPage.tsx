import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  Copy,
  Sliders,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PdfPreview } from '../components/PdfPreview';
import {
  getMachineByCode,
  uploadPdfDocument,
  calculatePrice,
  createPrintJob,
  createPaymentOrder,
  verifyPaymentStatus,
  getPrintJobStatus,
} from '../services/api';
import { subscribeToJobUpdates } from '../services/socket';
import {
  KioskMachine,
  UploadedPdfInfo,
  PrintOptions,
  PriceSummary,
  PrintJobStatus,
} from '../types';

declare global {
  interface Window {
    Cashfree?: any;
  }
}

export const KioskPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const machineCode = searchParams.get('machine') || 'PUNE-COLLEGE-001';

  // State
  const [machine, setMachine] = useState<KioskMachine | null>(null);
  const [loadingMachine, setLoadingMachine] = useState<boolean>(true);
  const [machineError, setMachineError] = useState<string | null>(null);

  // File Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [pdfInfo, setPdfInfo] = useState<UploadedPdfInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Print Options
  const [options, setOptions] = useState<PrintOptions>({
    selectedPages: 'all',
    copies: 1,
    colorMode: 'BW',
    paperSize: 'A4',
  });
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRangeInput, setCustomRangeInput] = useState<string>('');
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);

  // Pricing State
  const [priceSummary, setPriceSummary] = useState<PriceSummary | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState<boolean>(false);

  // Submission & Payment Tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<PrintJobStatus | null>(null);
  const [paymentStepText, setPaymentStepText] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submittingJob, setSubmittingJob] = useState<boolean>(false);

  // 1. Load Machine Info on Mount
  const loadMachineInfo = async () => {
    setLoadingMachine(true);
    setMachineError(null);
    try {
      const data = await getMachineByCode(machineCode);
      setMachine(data);
    } catch (err: any) {
      console.error('[KioskPage Machine Load Error]', err);
      setMachineError(
        err.response?.data?.message || 'Unable to connect to printing kiosk. Please check machine QR code.'
      );
    } finally {
      setLoadingMachine(false);
    }
  };

  useEffect(() => {
    loadMachineInfo();
  }, [machineCode]);

  // 2. Recalculate price when options or PDF info changes
  useEffect(() => {
    if (!pdfInfo) return;

    let isSubscribed = true;
    const updatePrice = async () => {
      setCalculatingPrice(true);
      try {
        const summary = await calculatePrice(pdfInfo.totalPages, options);
        if (isSubscribed) {
          setPriceSummary(summary);
        }
      } catch (err) {
        console.error('[Price Calculation Error]', err);
      } finally {
        if (isSubscribed) setCalculatingPrice(false);
      }
    };

    const timer = setTimeout(() => {
      updatePrice();
    }, 250);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [pdfInfo, options]);

  const updateJobStatus = (newStatus: PrintJobStatus) => {
    const statusRank: Record<string, number> = {
      CREATED: 1,
      PAYMENT_PENDING: 2,
      PAID: 3,
      QUEUED: 4,
      PRINTING: 5,
      COMPLETED: 6,
      FAILED: 99,
    };

    setJobStatus((prevStatus) => {
      if (!prevStatus) return newStatus;
      if (newStatus === 'FAILED') return 'FAILED';
      const prevRank = statusRank[prevStatus] || 0;
      const nextRank = statusRank[newStatus] || 0;
      return nextRank >= prevRank ? newStatus : prevStatus;
    });
  };

  // 3. Listen for Socket.IO Real-time Job Status Updates when job is active
  useEffect(() => {
    if (!activeJobId) return;

    const unsubscribe = subscribeToJobUpdates(activeJobId, ({ status, errorMessage }) => {
      console.log(`[Socket Update Received] Status: ${status}`);
      updateJobStatus(status as PrintJobStatus);
      if (errorMessage) {
        setStatusMessage(errorMessage);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeJobId]);

  // 4. Fallback Polling to ensure completion state is reached reliably
  useEffect(() => {
    if (!activeJobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const job = await getPrintJobStatus(activeJobId);
        if (job && job.status) {
          console.log(`[Job Polling Check] Status: ${job.status}`);
          updateJobStatus(job.status as PrintJobStatus);
        }
      } catch (e) {
        // Silent catch for background polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, jobStatus]);

  // Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const info = await uploadPdfDocument(file);
      setPdfInfo(info);
      setPreviewPageNum(1);
    } catch (err: any) {
      console.error('[Upload Error]', err);
      setUploadError(err.response?.data?.message || 'Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCustomRangeChange = (val: string) => {
    setCustomRangeInput(val);
    setOptions((prev) => ({
      ...prev,
      selectedPages: val.trim() ? val : 'all',
    }));
  };

  const handlePageModeToggle = (mode: 'all' | 'custom') => {
    setPageRangeMode(mode);
    if (mode === 'all') {
      setOptions((prev) => ({ ...prev, selectedPages: 'all' }));
    } else {
      setOptions((prev) => ({ ...prev, selectedPages: customRangeInput || '1' }));
    }
  };

  const handleCopiesChange = (delta: number) => {
    setOptions((prev) => ({
      ...prev,
      copies: Math.max(1, prev.copies + delta),
    }));
  };

  // Cashfree Payment & Print Handler
  const handlePaymentAndPrintSubmit = async () => {
    if (!pdfInfo || !machineCode) return;

    setSubmittingJob(true);
    setStatusMessage(null);
    setPaymentStepText('Creating Print Job...');

    try {
      // 1. Create Print Job in DB
      const createdJob = await createPrintJob(
        machineCode,
        pdfInfo.fileName,
        pdfInfo.totalPages,
        options
      );

      setActiveJobId(createdJob.id);
      updateJobStatus(createdJob.status);

      // 2. Create Payment Order on Backend (Cashfree Production or Sandbox)
      setPaymentStepText('Preparing Cashfree Payment Order...');
      const paymentOrder = await createPaymentOrder(createdJob.id, 'CASHFREE');

      // 3. Open Cashfree Web Checkout JS SDK
      if (window.Cashfree) {
        setPaymentStepText('Opening Cashfree Checkout...');
        const envMode = (paymentOrder.gatewayData?.environment || '').toUpperCase();
        const cashfreeMode = envMode === 'PRODUCTION' || envMode === 'PROD' ? 'production' : 'sandbox';

        console.log(`[Frontend Cashfree] Initializing Cashfree JS SDK in mode: ${cashfreeMode}`);
        const cashfree = window.Cashfree({ mode: cashfreeMode });

        const checkoutOptions = {
          paymentSessionId: paymentOrder.paymentSessionId,
          redirectTarget: '_modal',
        };

        try {
          await cashfree.checkout(checkoutOptions);
        } catch (sdkErr) {
          console.warn('[Cashfree SDK Modal Return]', sdkErr);
        }
      }

      // 4. Perform Server-Side Payment Verification
      setPaymentStepText('Verifying Payment with Cashfree Server...');
      const verifyRes = await verifyPaymentStatus(createdJob.id, paymentOrder.orderId);

      updateJobStatus(verifyRes.status as PrintJobStatus);
      setPaymentStepText(null);
    } catch (err: any) {
      console.error('[Payment & Print Submit Error]', err);
      updateJobStatus('FAILED');
      setPaymentStepText(null);
      setStatusMessage(
        err.response?.data?.message || 'Payment verification failed or payment was cancelled.'
      );
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleResetFlow = () => {
    setPdfInfo(null);
    setActiveJobId(null);
    setJobStatus(null);
    setPaymentStepText(null);
    setStatusMessage(null);
    setUploadError(null);
    setOptions({
      selectedPages: 'all',
      copies: 1,
      colorMode: 'BW',
      paperSize: 'A4',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Header machine={machine} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Loading Machine Banner */}
        {loadingMachine && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">Connecting to Kiosk Machine ({machineCode})...</p>
          </div>
        )}

        {/* Machine Error Banner */}
        {!loadingMachine && machineError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl shadow-sm flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-base">Kiosk Unavailable</h3>
              <p className="text-xs text-red-600 mt-1">{machineError}</p>
            </div>
            <button
              onClick={loadMachineInfo}
              className="mt-2 inline-flex items-center gap-2 bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 active:scale-95 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        )}

        {/* Active Flow: Machine OK */}
        {!loadingMachine && machine && (
          <>
            {/* SCREEN 1: Active Print & Payment Progress Screen */}
            {activeJobId && (jobStatus || paymentStepText) ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center gap-6">
                <div className="relative">
                  {jobStatus === 'COMPLETED' ? (
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                  ) : jobStatus === 'FAILED' ? (
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                      <AlertCircle className="w-12 h-12" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center relative">
                      <Printer className="w-10 h-10 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {paymentStepText ? (
                      paymentStepText
                    ) : (
                      <>
                        {jobStatus === 'PAYMENT_PENDING' && 'Payment Pending...'}
                        {(jobStatus === 'PAID' || jobStatus === 'QUEUED') && 'Print Job Queued'}
                        {jobStatus === 'PRINTING' && '⏳ Printing...'}
                        {jobStatus === 'COMPLETED' && '🎉 Print Successful!'}
                        {jobStatus === 'FAILED' && 'Payment or Printing Failed'}
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {jobStatus === 'COMPLETED'
                      ? 'Your document has been printed successfully.'
                      : jobStatus === 'PRINTING'
                      ? 'Your document is being printed at the kiosk.'
                      : jobStatus === 'QUEUED'
                      ? 'Payment verified. Job dispatched to print agent.'
                      : jobStatus === 'PAYMENT_PENDING'
                      ? 'Please complete checkout in the Cashfree payment window.'
                      : jobStatus === 'FAILED'
                      ? (statusMessage || 'An error occurred during payment verification or print execution.')
                      : 'Processing your print job...'}
                  </p>
                </div>

                {/* Progress Flow Checklist */}
                <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 text-left text-xs font-semibold">
                  {/* Step 1: Payment Successful */}
                  <div className={`flex items-center gap-2.5 ${jobStatus === 'PAID' || jobStatus === 'QUEUED' || jobStatus === 'PRINTING' || jobStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Payment Successful</span>
                  </div>

                  {/* Step 2: Payment Verified */}
                  <div className={`flex items-center gap-2.5 ${jobStatus === 'PAID' || jobStatus === 'QUEUED' || jobStatus === 'PRINTING' || jobStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Payment Verified</span>
                  </div>

                  {/* Step 3: Print Job Queued */}
                  <div className={`flex items-center gap-2.5 ${jobStatus === 'QUEUED' || jobStatus === 'PRINTING' || jobStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {jobStatus === 'QUEUED' || jobStatus === 'PRINTING' || jobStatus === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
                    )}
                    <span>Print Job Queued</span>
                  </div>

                  {/* Step 4: Printing */}
                  <div className={`flex items-center gap-2.5 ${jobStatus === 'PRINTING' ? 'text-amber-600 font-bold' : jobStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {jobStatus === 'PRINTING' ? (
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    ) : jobStatus === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
                    )}
                    <span>{jobStatus === 'PRINTING' ? '⏳ Printing...' : 'Printing'}</span>
                  </div>

                  {/* Step 5: Print Successful */}
                  <div className={`flex items-center gap-2.5 ${jobStatus === 'COMPLETED' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {jobStatus === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
                    )}
                    <span>Print Successful</span>
                  </div>
                </div>

                {/* Final Screen Details Card */}
                {jobStatus === 'COMPLETED' && (
                  <div className="w-full bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-slate-500 font-medium">File name:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]" title={pdfInfo?.originalName || pdfInfo?.fileName}>
                        {pdfInfo?.originalName || pdfInfo?.fileName || 'Document.pdf'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-slate-500 font-medium">Number of pages:</span>
                      <span className="font-bold text-slate-800">
                        {priceSummary?.pagesToPrint || pdfInfo?.totalPages || 1}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-slate-500 font-medium">Copies:</span>
                      <span className="font-bold text-slate-800">{options.copies}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Total amount:</span>
                      <span className="font-black text-emerald-700 text-sm">
                        ₹{priceSummary ? priceSummary.totalPrice.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Done Button */}
                {jobStatus === 'COMPLETED' && (
                  <button
                    onClick={handleResetFlow}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-2 text-base"
                  >
                    Done
                  </button>
                )}

                {jobStatus === 'FAILED' && (
                  <button
                    onClick={handleResetFlow}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                )}
              </div>
            ) : (
              /* SCREEN 2: Upload & Options Selection Flow */
              <>
                {/* Step 1: Upload Dropzone */}
                {!pdfInfo && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                        1
                      </div>
                      <span>Select PDF Document</span>
                    </div>

                    <label className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-amber-50 group">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                        {uploading ? (
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UploadCloud className="w-7 h-7" />
                        )}
                      </div>
                      <p className="font-bold text-sm text-slate-800">
                        {uploading ? 'Processing PDF...' : 'Tap to Choose PDF File'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Supports PDF format up to 20MB</p>
                    </label>

                    {uploadError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: PDF Preview & Options */}
                {pdfInfo && (
                  <div className="flex flex-col gap-5">
                    {/* Document Header Info */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-sm text-slate-900 truncate">{pdfInfo.originalName}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {pdfInfo.totalPages} Page{pdfInfo.totalPages > 1 ? 's' : ''} • {(pdfInfo.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleResetFlow}
                        className="text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition"
                      >
                        Change
                      </button>
                    </div>

                    {/* PDF Preview Canvas */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Preview (Page {previewPageNum} of {pdfInfo.totalPages})</span>
                        {pdfInfo.totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={previewPageNum <= 1}
                              onClick={() => setPreviewPageNum((p) => Math.max(1, p - 1))}
                              className="px-2 py-0.5 bg-slate-100 disabled:opacity-40 rounded text-slate-700 font-bold"
                            >
                              Prev
                            </button>
                            <button
                              disabled={previewPageNum >= pdfInfo.totalPages}
                              onClick={() => setPreviewPageNum((p) => Math.min(pdfInfo.totalPages, p + 1))}
                              className="px-2 py-0.5 bg-slate-100 disabled:opacity-40 rounded text-slate-700 font-bold"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                      <PdfPreview fileUrl={pdfInfo.fileUrl} currentPage={previewPageNum} />
                    </div>

                    {/* Print Configuration Form */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
                        <Sliders className="w-5 h-5 text-amber-600" />
                        <span>Print Options</span>
                      </div>

                      {/* 1. Page Selection */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" /> Page Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePageModeToggle('all')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                              pageRangeMode === 'all'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            All ({pdfInfo.totalPages}) Pages
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePageModeToggle('custom')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                              pageRangeMode === 'custom'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Specific Pages
                          </button>
                        </div>

                        {pageRangeMode === 'custom' && (
                          <input
                            type="text"
                            placeholder="e.g. 1-5, 8, 11-15"
                            value={customRangeInput}
                            onChange={(e) => handleCustomRangeChange(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        )}
                      </div>

                      {/* 2. Color Mode */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Color Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOptions((p) => ({ ...p, colorMode: 'BW' }))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-0.5 transition ${
                              options.colorMode === 'BW'
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>Black & White</span>
                            <span className="text-[10px] opacity-80">₹2.00 / page</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOptions((p) => ({ ...p, colorMode: 'COLOR' }))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-0.5 transition ${
                              options.colorMode === 'COLOR'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>Color</span>
                            <span className="text-[10px] opacity-80">₹10.00 / page</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Paper Size & Copies */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700">Paper Size</label>
                          <select
                            value={options.paperSize}
                            onChange={(e) => setOptions((p) => ({ ...p, paperSize: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          >
                            <option value="A4">A4 (Standard)</option>
                            <option value="A3">A3 (Large)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Copy className="w-3 h-3 text-slate-500" /> Copies
                          </label>
                          <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleCopiesChange(-1)}
                              className="px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300"
                            >
                              -
                            </button>
                            <span className="flex-1 text-center font-bold text-xs text-slate-900">
                              {options.copies}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopiesChange(1)}
                              className="px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Order Price Summary & Cashfree Payment Button */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-400">Total Price</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-amber-400">
                              ₹{priceSummary ? priceSummary.totalPrice.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({priceSummary?.pagesToPrint || 0} pgs × {options.copies} copy)
                            </span>
                          </div>
                        </div>
                        {calculatingPrice && (
                          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePaymentAndPrintSubmit}
                        disabled={submittingJob || calculatingPrice || !priceSummary}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-4 px-6 rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-2 text-base tracking-wide disabled:opacity-50"
                      >
                        {submittingJob ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{paymentStepText || 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            <span>PAY ₹{priceSummary ? priceSummary.totalPrice.toFixed(2) : '0.00'} & PRINT</span>
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>Secured by Cashfree Payments</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

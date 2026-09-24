import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  fileUrl: string;
  currentPage?: number;
  onTotalPagesLoaded?: (count: number) => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ fileUrl, currentPage = 1, onTotalPagesLoaded }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const getFullUrl = (url: string): string => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      const rawUrl = ((import.meta as any).env?.VITE_API_URL as string) || '';
      if (rawUrl) {
        const trimmed = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
        return `${trimmed}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return url;
    };

    const loadPdf = async () => {
      try {
        const targetUrl = getFullUrl(fileUrl);
        const loadingTask = pdfjsLib.getDocument(targetUrl);
        const doc = await loadingTask.promise;
        
        if (!isMounted) return;
        setPdfDoc(doc);
        if (onTotalPagesLoaded) {
          onTotalPagesLoaded(doc.numPages);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('[PdfPreview Error]', err);
        if (isMounted) {
          setError('Failed to load PDF preview');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    const renderPage = async () => {
      try {
        const targetPageNum = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
        const page = await pdfDoc.getPage(targetPageNum);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = canvas.parentElement?.clientWidth || 320;
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('[PdfPageRender Error]', err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage]);

  return (
    <div className="relative w-full overflow-hidden bg-slate-900/5 rounded-xl border border-slate-200 p-2 flex flex-col items-center justify-center min-h-[260px]">
      {loading && (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading document preview...</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm py-8 font-medium">
          ⚠️ {error}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`max-w-full rounded shadow-md border border-slate-200 bg-white transition-opacity duration-200 ${
          loading || error ? 'hidden' : 'block'
        }`}
      />
    </div>
  );
};

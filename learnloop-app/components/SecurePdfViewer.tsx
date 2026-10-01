'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Point to the static worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ViewerProps {
  pdfUrl: string;
  userEmail: string;
}

export default function SecurePdfViewer({ pdfUrl, userEmail }: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderPromiseRef = useRef<Promise<void> | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [blurScreen, setBlurScreen] = useState<boolean>(false);

  // Blur screen if window loses focus or screenshot keys are pressed
  useEffect(() => {
    const handleBlur = () => setBlurScreen(true);
    const handleFocus = () => setBlurScreen(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3')) // Mac shortcut
      ) {
        setBlurScreen(true);
        navigator.clipboard.writeText(''); // Clear clipboard
        alert('Screenshots and screen capture are disabled.');
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keyup', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  // Render PDF Page onto HTML5 Canvas + Stamp Watermark
  useEffect(() => {
    let cancelled = false;
    let cancelRender: (() => void) | null = null;

    const renderPage = async () => {
      try {
        const previousRender = renderPromiseRef.current;
        if (previousRender) await previousRender.catch(() => undefined);
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF content onto canvas
        const renderTask = page.render({ canvas, canvasContext: context, viewport });
        cancelRender = () => renderTask.cancel();
        const renderPromise = renderTask.promise;
        renderPromiseRef.current = renderPromise;
        await renderPromise;
        if (cancelled) return;

        // Overlay Dynamic Watermark across canvas center
        context.save();
        context.globalAlpha = 0.18; // Semi-transparent
        context.font = '24px sans-serif';
        context.fillStyle = '#ef4444'; // Subtle red/gray tone
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(-Math.PI / 4); // Diagonal tilt
        
        const watermarkText = `LICENSED TO: ${userEmail.toUpperCase()}`;
        const textMetrics = context.measureText(watermarkText);
        context.fillText(watermarkText, -textMetrics.width / 2, 0);
        context.restore();

      } catch (err: unknown) {
        if (!(err instanceof Error) || err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      cancelRender?.();
    };
  }, [pdfUrl, currentPage, userEmail]);

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg select-none ${blurScreen ? 'blur-xl' : ''}`}>
      {/* CSS Rules to prevent printing & right-clicking */}
      <style jsx global>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      {/* Control Navigation */}
      <div className="flex items-center gap-4 mb-4 text-white">
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {numPages}
        </span>
        <button
          disabled={currentPage >= numPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Canvas Container with disabled pointer events to block drag-select */}
      <div onContextMenu={(e) => e.preventDefault()} className="overflow-auto border border-slate-700 rounded">
        <canvas ref={canvasRef} className="block pointer-events-none" />
      </div>

      <div className="mt-4 flex w-full justify-end text-white">
        <button
          disabled={currentPage >= numPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          Next page
        </button>
      </div>
    </div>
  );
}
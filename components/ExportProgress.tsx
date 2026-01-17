import React from 'react';
import { DownloadIcon, CheckCircleIcon, XMarkIcon } from './icons';

interface ExportProgressProps {
  isExporting: boolean;
  progress?: number;
  message?: string;
  result?: {
    success: boolean;
    fileName: string;
    error?: string;
  } | null;
  onClose?: () => void;
}

const ExportProgress: React.FC<ExportProgressProps> = ({ 
  isExporting, 
  progress = 0, 
  message = "Generating report...",
  result,
  onClose
}) => {
  if (!isExporting && !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))] shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
        
        {isExporting ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-4">
              <svg className="animate-spin w-full h-full text-[rgb(var(--color-primary-rgb))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {progress > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Exporting...</h3>
            <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm">{message}</p>
          </div>
        ) : result?.success ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
              <CheckCircleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Export Complete</h3>
            <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm mb-6">
              Processing {result.fileName} has finished successfully.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <XMarkIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Export Failed</h3>
            <p className="text-red-500 text-sm mb-6 max-w-[250px]">
              {result?.error || "An unexpected error occurred during export."}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportProgress;

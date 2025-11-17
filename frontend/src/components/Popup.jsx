import React, { useEffect } from 'react';

export default function Popup({ message, type = 'info', onClose, onConfirm, onCancel, showConfirm = false }) {
  useEffect(() => {
    if (!showConfirm) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 max-w-md w-full mx-4 ${getBgColor()} animate-popup`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{getIcon()}</div>
          <p className="text-white text-lg font-semibold mb-4">{message}</p>
          {showConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              OK
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes popup {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-popup {
          animation: popup 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}


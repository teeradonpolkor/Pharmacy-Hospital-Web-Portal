import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Delete, ShieldCheck } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setHasError(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (pinInput.length === currentPin.length) {
      if (pinInput === currentPin) {
        setHasError(false);
        onSuccess();
        onClose();
      } else {
        setHasError(true);
        setErrorMessage('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        const timer = setTimeout(() => {
          setPinInput('');
          setHasError(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [pinInput, currentPin, onSuccess, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < currentPin.length) {
          setPinInput((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinInput, currentPin.length, onClose]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pinInput.length < currentPin.length) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setHasError(false);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E223D]/50 backdrop-blur-md">
      <div
        ref={containerRef}
        className={`relative w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-2xl text-center border border-[#1E223D]/15 transition-all shadow-2xl ${
          hasError ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1E223D] flex items-center justify-center mb-4 text-[#E6D5B7] shadow-md shadow-[#1E223D]/20">
          <Lock className="w-6 h-6 text-[#E6D5B7]" />
        </div>

        <h3 className="text-xl font-bold text-[#1E223D] tracking-tight">
          เข้าสู่โหมดจัดการระบบ
        </h3>
        <p className="text-xs text-[#4B5277] mt-1 mb-6">
          กรุณากรอกรหัส PIN ผู้ดูแลระบบ (PIN เริ่มต้น: <span className="text-[#F54F1B] font-bold tracking-wider font-mono">1234</span>)
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {Array.from({ length: currentPin.length }).map((_, idx) => {
            const isFilled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#F54F1B] scale-110 shadow-sm'
                    : 'bg-[#1E223D]/10 border border-[#1E223D]/20'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-600 font-semibold mb-4 animate-fade-in">
            {errorMessage}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[#F4EFE6] hover:bg-[#E6D5B7] text-xl font-semibold text-[#1E223D] active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F54F1B]/40 shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl text-xs font-semibold text-[#4B5277] hover:text-[#1E223D] hover:bg-[#1E223D]/5 active:scale-95 transition-all flex items-center justify-center"
          >
            ล้าง
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#F4EFE6] hover:bg-[#E6D5B7] text-xl font-semibold text-[#1E223D] active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F54F1B]/40 shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl text-[#4B5277] hover:text-[#F54F1B] hover:bg-[#1E223D]/5 active:scale-95 transition-all flex items-center justify-center"
            aria-label="ลบตัวเลข"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1E223D]/10 flex items-center justify-center gap-1.5 text-[11px] text-[#4B5277]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F54F1B]" />
          <span>ระบบรักษาความปลอดภัย ป้องกันการแก้ไขลิงก์โดยไม่ได้รับอนุญาต</span>
        </div>
      </div>
    </div>
  );
};

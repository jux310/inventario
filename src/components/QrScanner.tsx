import React, { useEffect, useRef } from 'react';
import QrScannerLib from 'qr-scanner';
import { X } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QrScannerDialog({ onScan, onClose, isOpen }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerLib | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        scannerRef.current = new QrScannerLib(
          videoRef.current,
          result => {
            try {
              onScan(result.data);
            } catch (error) {
              console.error('Invalid QR code data:', error);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        );

        await scannerRef.current.start();
        dialogRef.current?.showModal();
      } catch (error) {
        console.error('Error accessing camera:', error);
        onClose();
        alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      }
    };

    initScanner();

    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 relative border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Escanear Código QR
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-inner border-2 border-white/10 relative" style={{ minHeight: '400px' }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain transform -scale-x-100"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[3px] border-white/40 rounded-xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg" />
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Apunta la cámara al código QR del ítem para escanearlo
        </p>
      </div>
    </dialog>
  );
}
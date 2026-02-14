import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, RotateCcw, Image as ImageIcon, Scan } from 'lucide-react';
import { Button } from './Button';

interface CameraProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  onUpload: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onCancel, onUpload }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure you have granted permission.');
      console.error(err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        // Play a shutter sound or haptic feedback if possible could go here
        stopCamera();
        onCapture(imageData);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#0B1120]">
        <p className="text-red-400 mb-4 font-mono">{error}</p>
        <Button onClick={onCancel}>RETURN TO MENU</Button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-black">
      {/* Video Preview */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute min-w-full min-h-full object-cover opacity-90"
        />
        
        {/* Technical HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Central Focus Brackets */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-orange-500/30">
             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/50">
               <Scan size={32} strokeWidth={1} />
             </div>
          </div>

          {/* Grid Lines */}
          <div className="w-full h-full border-2 border-slate-900/10 grid grid-cols-3 grid-rows-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/5" />
            ))}
          </div>
          
          {/* Status Text */}
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest bg-black/50 px-2 py-1">
              Live Feed • REC
            </span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="p-8 bg-[#0F172A] border-t-2 border-orange-600 flex justify-between items-center z-10 relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600 px-4 py-0.5 text-[10px] font-mono uppercase text-white tracking-widest rounded-t-lg">
            Shutter Control
         </div>

        <button 
          onClick={onCancel}
          className="p-4 rounded-none border border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
        >
          <RotateCcw size={20} />
        </button>

        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform bg-white/5 relative group"
        >
          <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-ping"></div>
          <div className="w-16 h-16 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)] border-4 border-slate-200" />
        </button>

        <button 
          onClick={onUpload}
          className="p-4 rounded-none border border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
        >
          <ImageIcon size={20} />
        </button>
      </div>
    </div>
  );
};
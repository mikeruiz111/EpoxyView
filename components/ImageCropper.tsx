import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Check, X, ZoomIn, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleCrop = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output Constraints
    const MAX_DIM = 1024;
    
    // Get visible geometry
    const contRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate output dimensions based on container aspect ratio
    const aspect = contRect.width / contRect.height;
    let outWidth, outHeight;

    if (aspect > 1) {
        // Landscape
        outWidth = MAX_DIM; 
        outHeight = MAX_DIM / aspect;
    } else {
        // Portrait / Square (Fallback, though we enforce landscape now)
        outHeight = MAX_DIM;
        outWidth = MAX_DIM * aspect;
    }

    canvas.width = outWidth;
    canvas.height = outHeight;

    // Fill black for safety
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, outWidth, outHeight);

    // Calculate Source Rectangle (What part of the image is visible?)
    // Scale factor between "Natural Image pixels" and "Screen pixels"
    const naturalScale = img.naturalWidth / imgRect.width;

    // Top-Left of container relative to Top-Left of Image (in Screen Pixels)
    const offsetX = contRect.left - imgRect.left;
    const offsetY = contRect.top - imgRect.top;

    // Convert to Natural Pixels
    const sx = offsetX * naturalScale;
    const sy = offsetY * naturalScale;
    const sWidth = contRect.width * naturalScale;
    const sHeight = contRect.height * naturalScale;

    // Draw
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outWidth, outHeight);

    onConfirm(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1120] text-white">
        {/* Header */}
        <div className="flex-none p-4 bg-[#0F172A] border-b border-slate-700 flex justify-between items-center z-10">
            <h3 className="font-mono text-xs uppercase tracking-widest text-orange-500">Edit / Crop</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden bg-black touch-none flex items-center justify-center p-6">
            <div 
                ref={containerRef}
                className="relative w-full max-w-lg aspect-[4/3] border-2 border-orange-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] overflow-hidden cursor-move bg-slate-900"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Target"
                    className="absolute max-w-none origin-center select-none pointer-events-none"
                    style={{ 
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                        top: '50%',
                        left: '50%',
                        minWidth: '100%',
                        minHeight: '100%',
                        objectFit: 'cover' 
                    }}
                    draggable={false}
                />
                
                {/* Rule of Thirds Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3">
                     {[...Array(9)].map((_, i) => <div key={i} className="border border-white/40"></div>)}
                </div>
            </div>
            
            <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                 <span className="text-[10px] bg-black/70 px-3 py-1.5 rounded-full text-white/90 font-mono uppercase backdrop-blur-sm border border-white/10">
                    Landscape Crop • Pan & Zoom
                 </span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex-none p-6 bg-[#0F172A] border-t border-slate-700 space-y-6 z-10">
            <div className="flex items-center gap-4 px-2">
                <ZoomIn size={16} className="text-slate-400" />
                <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.05" 
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => { setScale(1); setPosition({x:0, y:0}); }} icon={<RotateCcw size={16}/>}>Reset</Button>
                <Button onClick={handleCrop} icon={<Check size={16}/>}>Confirm Crop</Button>
            </div>
        </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageFile } from '../types';
import { UndoIcon, TrashIcon } from './icons';

interface DrawingCanvasProps {
  baseImage: ImageFile;
  onImageUpdate: (imageFile: ImageFile | null) => void;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  brushSize: number;
}

const COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#facc15' },
    { name: 'White', value: '#ffffff' }
];
const BRUSH_SIZES = [{name: '小', value: 4}, {name: '中', value: 12}, {name: '大', value: 24}];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ baseImage, onImageUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
        if (stroke.points.length < 1) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    imageRef.current = img;
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        redrawCanvas();
    };
    img.src = `data:${baseImage.mimeType};base64,${baseImage.base64}`;
  }, [baseImage]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    onImageUpdate(strokes.length > 0 ? { base64, mimeType: 'image/png' } : null);
  }, [onImageUpdate, strokes]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const p = getCoords(e);
    if (!p) return;
    setIsDrawing(true);
    setStrokes(prev => [...prev, { points: [p], color, brushSize }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const p = getCoords(e);
    if (!p) return;
    setStrokes(prev => {
        const last = { ...prev[prev.length - 1] };
        last.points = [...last.points, p];
        return [...prev.slice(0, -1), last];
    });
  };

  const handleEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      exportImage();
    }
  };

  const handleUndo = () => {
    setStrokes(prev => {
      const next = prev.slice(0, -1);
      // 利用状态更新后的回调逻辑在 setTimeout 中执行
      return next;
    });
    // 强制触发重绘并在下一帧导出
    setTimeout(exportImage, 10);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-800 bg-black cursor-crosshair">
            <canvas
                ref={canvasRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="w-full h-auto block touch-none"
            />
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 bg-gray-900 rounded-2xl border border-gray-800">
            <div className="flex gap-1.5">
                {COLORS.map(c => (
                    <button 
                        key={c.name} 
                        onClick={() => setColor(c.value)} 
                        className={`w-6 h-6 rounded-full transition-all ${color === c.value ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-gray-900 scale-110' : 'opacity-60 hover:opacity-100'}`} 
                        style={{backgroundColor: c.value}} 
                    />
                ))}
            </div>

            <div className="flex gap-1 bg-gray-950 p-1 rounded-lg">
                {BRUSH_SIZES.map(bs => (
                    <button 
                        key={bs.name} 
                        onClick={() => setBrushSize(bs.value)} 
                        className={`px-2.5 py-1 text-[10px] font-black rounded ${brushSize === bs.value ? 'bg-cyan-500 text-white' : 'text-gray-500'}`}
                    >
                        {bs.name}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                 <button onClick={handleUndo} disabled={strokes.length === 0} className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:text-white disabled:opacity-20 transition-all active:scale-90">
                    <UndoIcon />
                 </button>
                 <button onClick={() => {setStrokes([]); setTimeout(exportImage, 10);}} disabled={strokes.length === 0} className="p-2 bg-gray-800 text-red-500 rounded-lg hover:bg-red-500/10 disabled:opacity-20 transition-all active:scale-90">
                    <TrashIcon />
                 </button>
            </div>
        </div>
    </div>
  );
};

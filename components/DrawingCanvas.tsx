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
    { name: 'Yellow', value: '#eab308' },
    { name: 'Black', value: '#000000' }
];
const BRUSH_SIZES = [{name: 'S', value: 5}, {name: 'M', value: 10}, {name: 'L', value: 20}];

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
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    imageRef.current = img;
    img.onload = () => {
        const containerWidth = canvas.parentElement?.clientWidth || 600;
        const scale = Math.min(1, containerWidth / img.width);
        canvas.width = img.width;
        canvas.height = img.height;
        // The canvas is rendered at its intrinsic size, but CSS scales it down to fit the container.
        canvas.style.width = `100%`;
        canvas.style.height = `auto`;
        redrawCanvas();
    };
    img.src = `data:${baseImage.mimeType};base64,${baseImage.base64}`;

  }, [baseImage, redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // We need to redraw one last time before exporting to ensure all strokes are on the canvas.
    redrawCanvas();

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    
    if (strokes.length > 0) {
        onImageUpdate({ base64, mimeType: 'image/png' });
    } else {
        onImageUpdate(null); // No annotations, signal to use original
    }
  }, [onImageUpdate, strokes.length, redrawCanvas]);

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in event ? event.touches[0] : event;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords) return;
    setIsDrawing(true);
    setStrokes(prev => [...prev, { points: [coords], color, brushSize }]);
  }, [color, brushSize]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords) return;
    setStrokes(prev => {
        const newStrokes = [...prev];
        const lastStroke = newStrokes[newStrokes.length - 1];
        lastStroke.points.push(coords);
        return newStrokes;
    });
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Use timeout to ensure the final point is registered before exporting
    setTimeout(exportImage, 0);
  }, [isDrawing, exportImage]);

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
    setTimeout(exportImage, 0);
  };
  
  const handleClear = () => {
    setStrokes([]);
    setTimeout(exportImage, 0);
  };

  return (
    <div className="flex flex-col items-center gap-3">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="rounded-lg border border-gray-600 max-w-full"
            style={{ touchAction: 'none' }} // Prevents default touch actions like scrolling
        />
        <div className="w-full p-2 bg-gray-900/50 rounded-lg flex flex-wrap items-center justify-center gap-4">
            {/* Color Palette */}
            <div className="flex items-center gap-2">
                {COLORS.map(c => (
                    <button key={c.name} aria-label={`Select ${c.name} color`} onClick={() => setColor(c.value)} className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : ''}`} style={{backgroundColor: c.value}} />
                ))}
            </div>
            {/* Brush Size */}
            <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-full">
                {BRUSH_SIZES.map(bs => (
                    <button key={bs.name} aria-label={`Select brush size ${bs.name}`} onClick={() => setBrushSize(bs.value)} className={`px-2 py-0.5 text-xs rounded-full ${brushSize === bs.value ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>{bs.name}</button>
                ))}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
                 <button onClick={handleUndo} disabled={strokes.length === 0} className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300">
                    <UndoIcon />
                 </button>
                 <button onClick={handleClear} disabled={strokes.length === 0} className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300">
                    <TrashIcon />
                 </button>
            </div>
        </div>
    </div>
  );
};

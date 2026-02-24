
import React, { useRef, useState, useCallback, ChangeEvent } from 'react';
import { ImageFile } from '../types';
import { fileToImageFile } from '../utils/fileUtils';
import { CameraIcon, UploadIcon } from './icons';

interface ImageInputProps {
  onImageSelect: (image: ImageFile | null) => void;
  placeholderText?: string;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect, placeholderText }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onImageSelect(imageFile);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
      } catch (error) {
        onImageSelect(null);
        setPreview(null);
      }
    }
    event.target.value = '';
  }, [onImageSelect, preview]);

  return (
    <div className="w-full space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group relative aspect-video w-full bg-gray-950 border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:border-cyan-500/40 cursor-pointer"
      >
        {preview ? (
          <img src={preview} alt="Selected preview" className="object-contain h-full w-full" />
        ) : (
          <div className="text-center p-6 space-y-2">
            <div className="flex justify-center text-gray-700 group-hover:text-cyan-500/50 transition-colors">
                <UploadIcon />
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">{placeholderText || '点击此处上传图片'}</p>
          </div>
        )}
      </div>
      
      {/* 极强制隐藏逻辑，确保不影响布局 */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />

      <div className="flex gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-gray-300 text-xs sm:text-sm font-bold rounded-xl border border-gray-800 hover:border-gray-700 transition-all active:scale-95 shadow-sm"
        >
          <UploadIcon />
          <span>选取文件</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-gray-300 text-xs sm:text-sm font-bold rounded-xl border border-gray-800 hover:border-gray-700 transition-all active:scale-95 shadow-sm"
        >
          <CameraIcon />
          <span>拍摄照片</span>
        </button>
      </div>
    </div>
  );
};

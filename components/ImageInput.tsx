
import React, { useRef, useState, useCallback, ChangeEvent } from 'react';
import { ImageFile } from '../types';
import { fileToImageFile } from '../utils/fileUtils';
import { CameraIcon, UploadIcon } from './icons';

interface ImageInputProps {
  onImageSelect: (image: ImageFile | null) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onImageSelect(imageFile);
        setPreview(URL.createObjectURL(file));
      } catch (error) {
        console.error("Error processing file:", error);
        onImageSelect(null);
        setPreview(null);
      }
    }
  }, [onImageSelect]);

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="Selected preview" className="object-contain h-full w-full" />
        ) : (
          <div className="text-center text-gray-400">
            <p className="font-semibold">Your Image Here</p>
            <p className="text-sm">Upload a photo or use your camera</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
        >
          <UploadIcon />
          Upload
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
        >
          <CameraIcon />
          Camera
        </button>
      </div>
    </div>
  );
};

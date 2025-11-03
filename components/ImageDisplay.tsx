import React from 'react';

interface ImageDisplayProps {
  originalImage: string | null;
  generatedImage: string | null;
  isLoading: boolean;
  onImageClick: (imageUrl: string) => void;
}

const ImageBox: React.FC<{ title: string; imageUrl: string | null; onImageClick?: (imageUrl: string) => void; children?: React.ReactNode }> = ({ title, imageUrl, onImageClick, children }) => {
    const isClickable = !!(imageUrl && onImageClick);

    return (
        <div className="flex flex-col w-full">
            <h3 className="text-md font-semibold text-gray-400 mb-2 text-center">{title}</h3>
            <div
                className={`aspect-video w-full bg-gray-900/50 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden relative group ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => isClickable && onImageClick(imageUrl!)}
                tabIndex={isClickable ? 0 : -1}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isClickable) { e.preventDefault(); onImageClick(imageUrl!); } }}
                role={isClickable ? "button" : undefined}
                aria-label={isClickable ? `Enlarge ${title} image` : undefined}
            >
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={title} className="object-contain h-full w-full transition-transform duration-300 group-hover:scale-105" />
                        {isClickable && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        )}
                    </>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse w-full h-full bg-gray-700 rounded-lg" />
);

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ originalImage, generatedImage, isLoading, onImageClick }) => {
  const showOriginal = !!originalImage;

  return (
    <div className="grid grid-cols-1 gap-4 flex-grow">
      {showOriginal && (
        <ImageBox
          title="Original"
          imageUrl={originalImage}
          onImageClick={onImageClick}
        >
          <p className="text-gray-500 text-sm">Original image will appear here</p>
        </ImageBox>
      )}
      <ImageBox
        title={showOriginal ? "Redesigned" : "Generated"}
        imageUrl={generatedImage}
        onImageClick={onImageClick}
      >
        {isLoading ? (
            <SkeletonLoader/>
        ) : !generatedImage ? (
            <p className="text-gray-500 text-sm">Your new design will appear here</p>
        ) : null}
      </ImageBox>
    </div>
  );
};

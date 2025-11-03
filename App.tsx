import React, { useState, useCallback } from 'react';
import { ImageFile } from './types';
import { editImage, generateImageFromText, generateImageWithStyle } from './services/geminiService';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { ImageDisplay } from './components/ImageDisplay';
import { SparklesIcon } from './components/icons';
import { ImageModal } from './components/ImageModal';
import { DrawingCanvas } from './components/DrawingCanvas';

type Mode = 'redesign' | 'text' | 'style';

const ModeButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
      active ? 'bg-cyan-500 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('redesign');
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<ImageFile | null>(null);
  const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const resetStateForModeChange = () => {
    setOriginalImage(null);
    setAnnotatedImage(null);
    setStyleImage(null);
    setGeneratedImage(null);
    setError(null);
    setPrompt('');
  };

  const handleModeChange = (newMode: Mode) => {
    if (mode === newMode) return;
    setMode(newMode);
    resetStateForModeChange();
  };

  const handleOriginalImageSelect = (image: ImageFile | null) => {
    setOriginalImage(image);
    setAnnotatedImage(null);
    setGeneratedImage(null);
    setError(null);
  };

  const handleAnnotatedImageUpdate = (image: ImageFile | null) => {
    setAnnotatedImage(image);
  };

  const handleStyleImageSelect = (image: ImageFile | null) => {
    setStyleImage(image);
    setGeneratedImage(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let generatedBase64: string;
      const imageToProcess = annotatedImage || originalImage;

      if (mode === 'text') {
        if (!prompt) {
          setError('Please provide a design prompt.');
          setIsLoading(false);
          return;
        }
        generatedBase64 = await generateImageFromText(prompt);
        if (originalImage) setOriginalImage(null);
      } else if (mode === 'style') {
        if (!imageToProcess || !styleImage) {
          setError('Please provide a main image, a style image, and a prompt.');
          setIsLoading(false);
          return;
        }
        generatedBase64 = await generateImageWithStyle(imageToProcess, styleImage, prompt);
      } else { // mode === 'redesign'
        if (!imageToProcess || !prompt) {
          setError('Please provide an image and a design prompt.');
          setIsLoading(false);
          return;
        }
        generatedBase64 = await editImage(imageToProcess, prompt);
      }
      setGeneratedImage(generatedBase64);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, originalImage, annotatedImage, styleImage, prompt]);

  const handleOpenModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null);
  };

  const getStepNumber = (baseNumber: number) => {
      if (mode === 'text') return baseNumber - 1;
      if (mode === 'style' && baseNumber > 1) return baseNumber + 1;
      return baseNumber;
  }

  const isGenerateDisabled = isLoading || !prompt || (mode !== 'text' && !originalImage) || (mode === 'style' && !styleImage);
  
  const displayImage = annotatedImage
    ? `data:${annotatedImage.mimeType};base64,${annotatedImage.base64}`
    : originalImage
    ? `data:${originalImage.mimeType};base64,${originalImage.base64}`
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Control Panel */}
          <div className="flex flex-col space-y-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div className="flex justify-center p-1 bg-gray-900/50 rounded-full space-x-1">
              <ModeButton active={mode === 'redesign'} onClick={() => handleModeChange('redesign')}>Redesign Image</ModeButton>
              <ModeButton active={mode === 'text'} onClick={() => handleModeChange('text')}>Generate from Text</ModeButton>
              <ModeButton active={mode === 'style'} onClick={() => handleModeChange('style')}>Redesign with Style</ModeButton>
            </div>

            {(mode === 'redesign' || mode === 'style') && (
              <div>
                <label className="text-lg font-semibold text-cyan-400 mb-2 block">1. Upload Main Image</label>
                <ImageInput onImageSelect={handleOriginalImageSelect} placeholderText="Main Image" />
                 {originalImage && (
                    <div className="mt-4">
                        <label className="text-md font-semibold text-cyan-400/90 mb-2 block">Optional: Mark areas to change</label>
                        <DrawingCanvas 
                            key={originalImage.base64}
                            baseImage={originalImage}
                            onImageUpdate={handleAnnotatedImageUpdate}
                        />
                    </div>
                )}
              </div>
            )}

            {mode === 'style' && (
              <div>
                <label className="text-lg font-semibold text-cyan-400 mb-2 block">2. Upload Style Image</label>
                <ImageInput onImageSelect={handleStyleImageSelect} placeholderText="Style Reference" />
              </div>
            )}

            <div>
              <label htmlFor="prompt" className="text-lg font-semibold text-cyan-400 mb-2 block">{getStepNumber(2)}. Describe Your Vision</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'text' ? "e.g., 'An eco-futuristic skyscraper...'" :
                  mode === 'style' ? "e.g., 'Apply a Van Gogh style to the building marked in blue...'" :
                  "e.g., 'Make the part marked in red a glass balcony'"
                }
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-gray-500"
                disabled={isLoading}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    Generate Design
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="flex flex-col bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg min-h-[50vh] lg:min-h-0">
             <h2 className="text-lg font-semibold text-cyan-400 mb-4">{getStepNumber(3)}. Witness the Transformation</h2>
             {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}
             <ImageDisplay
                originalImage={displayImage}
                generatedImage={generatedImage ? `data:image/png;base64,${generatedImage}` : null}
                isLoading={isLoading}
                onImageClick={handleOpenModal}
             />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        Powered by Gemini.
      </footer>
      <ImageModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        imageUrl={modalImageUrl}
      />
    </div>
  );
};

export default App;

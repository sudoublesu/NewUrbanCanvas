import React, { useState, useCallback } from 'react';
import { ImageFile } from './types';
import { generateDesign } from './services/geminiService';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { ImageDisplay } from './components/ImageDisplay';
import { SparklesIcon } from './components/icons';
import { ImageModal } from './components/ImageModal';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  const handleImageSelect = (image: ImageFile | null) => {
    setOriginalImage(image);
    setGeneratedImage(null); // Clear previous result when new image is selected
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError('Please provide an image and a design prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const generatedBase64 = await generateDesign(originalImage, prompt);
      setGeneratedImage(generatedBase64);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const handleOpenModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Control Panel */}
          <div className="flex flex-col space-y-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div>
              <label className="text-lg font-semibold text-cyan-400 mb-2 block">1. Upload Image</label>
              <ImageInput onImageSelect={handleImageSelect} />
            </div>

            <div>
              <label htmlFor="prompt" className="text-lg font-semibold text-cyan-400 mb-2 block">2. Describe Your Vision</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A futuristic cyberpunk style' or '变成一座垂直花园'"
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-gray-500"
                disabled={isLoading}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={!originalImage || !prompt || isLoading}
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
             <h2 className="text-lg font-semibold text-cyan-400 mb-4">3. Witness the Transformation</h2>
             {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}
             <ImageDisplay
                originalImage={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null}
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
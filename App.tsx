
import React, { useState, useCallback, useEffect } from 'react';
import { ImageFile } from './types';
import { editImage, generateImageFromText, generateImageWithStyle } from './services/geminiService';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { ImageDisplay } from './components/ImageDisplay';
import { SparklesIcon } from './components/icons';
import { ImageModal } from './components/ImageModal';
import { DrawingCanvas } from './components/DrawingCanvas';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type Mode = 'redesign' | 'text' | 'style';

const ModeButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
  const [isKeySelected, setIsKeySelected] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setOriginalImage(null);
    setAnnotatedImage(null);
    setStyleImage(null);
    setGeneratedImage(null);
    setError(null);
    setPrompt('');
  };

  const handleGenerate = useCallback(async () => {
    if (!isKeySelected) {
      setError("在使用 Nano Banana Pro 模型前，请先配置您的 API Key。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let generatedBase64: string;
      const imageToProcess = annotatedImage || originalImage;

      if (mode === 'text') {
        if (!prompt) throw new Error('请提供设计描述。');
        generatedBase64 = await generateImageFromText(prompt);
      } else if (mode === 'style') {
        if (!imageToProcess || !styleImage) throw new Error('请上传主图和风格参考图。');
        generatedBase64 = await generateImageWithStyle(imageToProcess, styleImage, prompt);
      } else {
        if (!imageToProcess || !prompt) throw new Error('请上传图片并输入设计描述。');
        generatedBase64 = await editImage(imageToProcess, prompt);
      }
      setGeneratedImage(generatedBase64);
      // 自动滚动到结果区域
      const resultEl = document.getElementById('render-canvas');
      if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      const err = e as Error;
      setError(err.message || '生成过程中发生错误。');
      if (err.message?.includes("not found")) setIsKeySelected(false);
    } finally {
      setIsLoading(false);
    }
  }, [mode, originalImage, annotatedImage, styleImage, prompt, isKeySelected]);

  const displayImage = annotatedImage
    ? `data:${annotatedImage.mimeType};base64,${annotatedImage.base64}`
    : originalImage
    ? `data:${originalImage.mimeType};base64,${originalImage.base64}`
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col pb-10">
      <Header />
      
      {!isKeySelected && (
        <div className="bg-cyan-900/40 border-b border-cyan-500/50 p-4 text-center sticky top-[72px] z-20 backdrop-blur-md">
          <p className="text-cyan-100 text-xs sm:text-sm mb-3 font-medium">
            当前处于 <b>Nano Banana Pro</b> 极清模式，需连接付费项目 API Key。
          </p>
          <button 
            onClick={handleSelectKey}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95"
          >
            立即配置 API Key
          </button>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-6 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 左侧：控制面板 */}
          <div className="flex flex-col space-y-6 bg-gray-900/60 p-5 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">选择模式</label>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-black rounded border border-cyan-500/20">PRO RENDERING</span>
              </div>
              <div className="flex bg-gray-950 p-1 rounded-xl gap-1">
                <ModeButton active={mode === 'redesign'} onClick={() => handleModeChange('redesign')}>智能重构</ModeButton>
                <ModeButton active={mode === 'text'} onClick={() => handleModeChange('text')}>灵感生成</ModeButton>
                <ModeButton active={mode === 'style'} onClick={() => handleModeChange('style')}>风格迁移</ModeButton>
              </div>
            </div>

            {(mode === 'redesign' || mode === 'style') && (
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">1. 上传主场景</label>
                <ImageInput onImageSelect={setOriginalImage} placeholderText="拖入或拍摄建筑照片" />
                 {originalImage && (
                    <div className="mt-4 p-4 bg-gray-950 rounded-2xl border border-gray-800">
                        <label className="text-xs font-bold text-cyan-500/80 mb-3 block">局部精准标记 (可选)</label>
                        <DrawingCanvas 
                            key={originalImage.base64}
                            baseImage={originalImage}
                            onImageUpdate={setAnnotatedImage}
                        />
                    </div>
                )}
              </div>
            )}

            {mode === 'style' && (
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">2. 目标风格参考</label>
                <ImageInput onImageSelect={setStyleImage} placeholderText="上传风格示例图" />
              </div>
            )}

            <div className="space-y-4">
              <label htmlFor="prompt" className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {mode === 'text' ? '1. 描述您的远景' : mode === 'style' ? '3. 补充细节要求' : '2. 输入设计指令'}
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'text' ? "例如：'一座未来主义的极简摩天大楼，位于热带雨林中...'" :
                  mode === 'style' ? "例如：'将外墙材质替换为图中所示的磨砂玻璃...'" :
                  "例如：'将建筑立面改为包豪斯风格，并增加夜晚霓虹灯装饰'"
                }
                className="w-full h-32 p-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm resize-none placeholder-gray-600"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt || (mode !== 'text' && !originalImage) || (mode === 'style' && !styleImage)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black rounded-2xl shadow-xl hover:shadow-cyan-500/20 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  2K 级深度渲染中...
                </span>
              ) : (
                <><SparklesIcon /><span>开始 AI 渲染</span></>
              )}
            </button>
          </div>

          {/* 右侧：结果画布 */}
          <div id="render-canvas" className="flex flex-col bg-gray-900/60 p-5 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl min-h-[400px]">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">渲染输出</h2>
             {error && (
               <div className="mb-6 bg-red-950/40 border border-red-500/30 text-red-200 p-4 rounded-2xl text-xs sm:text-sm animate-pulse">
                 {error}
               </div>
             )}
             <div className="flex-grow flex flex-col">
               <ImageDisplay
                  originalImage={displayImage}
                  generatedImage={generatedImage ? `data:image/png;base64,${generatedImage}` : null}
                  isLoading={isLoading}
                  onImageClick={(url) => { setModalImageUrl(url); setIsModalOpen(true); }}
               />
             </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-auto text-center py-8 px-4 opacity-30 text-[10px] font-bold uppercase tracking-[0.2em]">
        UrbanCanvas Engine v2.0 &copy; Powered by Gemini 3 Pro
      </footer>

      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageUrl={modalImageUrl} />
    </div>
  );
};

export default App;

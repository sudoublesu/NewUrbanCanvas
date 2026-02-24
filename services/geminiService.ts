
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ImageFile } from '../types';

// 每次调用时重新实例化以获取最新的 API Key
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const extractImageFromResponse = (response: GenerateContentResponse): string => {
    // Nano Banana 系列模型可能在多个 Part 中返回数据，需要遍历
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error('模型未能生成图像，请尝试更详细的描述。');
};

const handleApiError = (error: unknown): never => {
    console.error("Gemini API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
    
    if (errorMessage.includes("Requested entity was not found")) {
        throw new Error("API Key 验证失败。请重新选择有效的付费项目 API Key。");
    }
    
    throw new Error(`生成失败: ${errorMessage}`);
};

// 共享的图像配置
const PRO_IMAGE_CONFIG = {
    imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K" // 提升至 2K 分辨率以获得 Pro 级画质
    }
};

export const editImage = async (
  image: ImageFile,
  prompt: string
): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType,
                    },
                },
                {
                    text: `Redesign this architectural scene. Vision: ${prompt}. Maintain the original structural perspective but enhance materials, lighting, and textures to a professional photorealistic standard.`,
                },
            ],
        },
        config: PRO_IMAGE_CONFIG,
    });
    return extractImageFromResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

export const generateImageFromText = async (prompt: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { 
                parts: [{ text: `A high-end architectural visualization of ${prompt}. Hyper-realistic, 8k, cinematic lighting, professional photography style.` }] 
            },
            config: PRO_IMAGE_CONFIG,
        });
        return extractImageFromResponse(response);
    } catch (error) {
        handleApiError(error);
    }
};

export const generateImageWithStyle = async (
    mainImage: ImageFile,
    styleImage: ImageFile,
    prompt: string
): Promise<string> => {
    try {
        const ai = getAi();
        const parts: Part[] = [
            {
                inlineData: {
                    data: mainImage.base64,
                    mimeType: mainImage.mimeType,
                },
            },
            {
                inlineData: {
                    data: styleImage.base64,
                    mimeType: styleImage.mimeType,
                },
            },
            {
                text: `Transfer the artistic style, color grade, and material textures from the second image to the first architectural image. Additional context: ${prompt}`,
            },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts },
            config: PRO_IMAGE_CONFIG,
        });
        return extractImageFromResponse(response);
    } catch (error) {
        handleApiError(error);
    }
};

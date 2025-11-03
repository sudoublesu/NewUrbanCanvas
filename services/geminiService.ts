import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";
import { ImageFile } from '../types';

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const extractImageFromResponse = (response: GenerateContentResponse): string => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error('No image was generated. Please try a different prompt.');
};

const handleApiError = (error: unknown): never => {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to generate image: ${errorMessage}`);
};

export const editImage = async (
  image: ImageFile,
  prompt: string
): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType,
                    },
                },
                {
                    text: `Redesign this image of a building/street based on the following requirement: ${prompt}. The image may contain colored markings to highlight specific areas for modification. Pay close attention to these colored areas as described in the prompt. Maintain the overall structure and form but apply the new design realistically.`,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
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
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
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
                text: `Using the second image as an artistic style reference, redesign the first image. The first image may contain colored markings to highlight specific areas for modification. Apply the style, color palette, and textures from the reference image to the main image, but also follow instructions in the prompt regarding the marked areas. ${prompt ? `Additional instructions: ${prompt}` : ''}`,
            },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return extractImageFromResponse(response);
    } catch (error) {
        handleApiError(error);
    }
};

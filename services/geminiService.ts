
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImageFile } from '../types';

export const generateDesign = async (
  image: ImageFile,
  prompt: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const response: GenerateContentResponse = await ai.models.generateContent({
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
                    text: `Redesign this image of a building/street based on the following requirement: ${prompt}. Maintain the overall structure and form but apply the new design realistically.`,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error('No image was generated. Please try a different prompt.');
  } catch (error) {
    console.error("Error generating design with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }
};

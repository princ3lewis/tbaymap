
import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  '';
const hasKey = Boolean(apiKey && apiKey !== 'PLACEHOLDER_API_KEY');
const ai = hasKey ? new GoogleGenAI({ apiKey }) : null;

export const getCulturalContext = async (eventTitle: string, description: string) => {
  if (!ai) {
    return "Building community through shared experiences in the heart of Thunder Bay.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short 2-sentence cultural insight or a traditional Anishinaabe perspective related to this community event in Thunder Bay: "${eventTitle}: ${description}". If it's a sports event, mention something about strength or community play. If it's food, mention sharing or traditional ingredients.`,
      config: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Building community through shared experiences in the heart of Thunder Bay.";
  }
};

export const getLunarInsight = async () => {
  if (!ai) {
    return "The Great Moon: A time for reflection and storytelling.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What is the name of the current moon in the Anishinaabe (Ojibwe) 13-moon calendar for this time of year? Provide only the name and a 1-sentence description of its significance.",
      config: {
        maxOutputTokens: 100,
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    return "The Great Moon: A time for reflection and storytelling.";
  }
};

export const generateAudioSpeech = async (text: string) => {
  if (!ai) {
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say warmly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const suggestEvents = async (interests: string[]) => {
  if (!ai) {
    return [];
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these interests: ${interests.join(", ")}, suggest 3 local community event ideas for Thunder Bay that promote Indigenous culture or community wellness.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

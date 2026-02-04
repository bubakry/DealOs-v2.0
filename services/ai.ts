
import { GoogleGenAI, Type } from "@google/genai";
import { Deal } from "../types";

/**
 * AI Analysis Service using Google Gemini API
 */

const MODEL_CANDIDATES = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'] as const;

const getMetaEnv = () => {
  try {
    return (import.meta as any)?.env || {};
  } catch {
    return {};
  }
};

const getApiKey = () => {
  const metaEnv = getMetaEnv();
  const key =
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    metaEnv.VITE_GEMINI_API_KEY ||
    metaEnv.VITE_API_KEY ||
    '';

  if (!key || key === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini API key is missing or still set to PLACEHOLDER_API_KEY.');
  }

  return key;
};

const getAiClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

const errorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const generateWithModelFallback = async (
  ai: GoogleGenAI,
  buildRequest: (model: string) => Parameters<typeof ai.models.generateContent>[0]
) => {
  let lastError: unknown = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      return await ai.models.generateContent(buildRequest(model));
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed:`, errorMessage(error));
    }
  }
  throw lastError || new Error('All model fallbacks failed.');
};

export const analyzeListingMotivation = async (deal: Deal) => {
  try {
    const ai = getAiClient();
    const response = await generateWithModelFallback(ai, (model) => ({
      model,
      contents: `Analyze the following real estate listing remarks for "Motivation Triggers" and provide a strategy. 
      Property: ${deal.address}, Asking: $${deal.price}, DOM: ${deal.dom} days.
      Remarks: ${deal.remarks || 'No remarks provided.'}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivationScore: {
              type: Type.NUMBER,
              description: "A score from 1 to 10 indicating seller motivation based on remarks.",
            },
            triggers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Keywords or phrases indicating motivation (e.g., 'Moving out of state', 'Price reduced').",
            },
            suggestedApproach: {
              type: Type.STRING,
              description: "A concise recommendation on how to approach the listing agent.",
            },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Potential red flags like 'cash only', 'major foundation issues', or 'short sale'.",
            },
          },
          required: ["motivationScore", "triggers", "suggestedApproach", "riskFactors"],
        },
      }
    }));
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis failed:", errorMessage(error));
    return null;
  }
};

export const generateAgentScript = async (deal: Deal, strategy: string) => {
  try {
    const ai = getAiClient();
    const response = await generateWithModelFallback(ai, (model) => ({
      model,
      contents: `Generate a professional, high-converting phone script for a wholesaler calling a listing agent. 
      Deal Context: ${deal.address}, on market for ${deal.dom} days. Asking $${deal.price}.
      Strategy: ${strategy}. 
      Agent Name: ${deal.agentName || "the listing agent"}.
      
      The goal is to build rapport, verify motivation, and plant the seed for a cash offer. Keep it conversational and brief.`,
    }));
    
    return response.text;
  } catch (error) {
    console.error("Script generation failed:", errorMessage(error));
    return "Hi, I'm calling about the listing at " + deal.address + ". Is it still available?";
  }
};

interface CashBuyerScriptOptions {
  scenario: string;
  buyerName?: string;
  buyBox?: string;
  budget?: string;
  closingTimeline?: string;
  proofOfFunds?: string;
}

export const generateCashBuyerScript = async (deal: Deal, options: CashBuyerScriptOptions) => {
  try {
    const ai = getAiClient();
    const response = await generateWithModelFallback(ai, (model) => ({
      model,
      contents: `Generate a concise, professional outreach script for a wholesaler contacting a cash buyer.
      Listing: ${deal.address}, ${deal.city}, ${deal.state}. Asking $${deal.price}. Beds: ${deal.beds}, Baths: ${deal.baths}, Size: ${deal.sqft} sqft.
      Scenario: ${options.scenario}.
      Cash Buyer Name: ${options.buyerName || "cash buyer"}.
      Buyer Buy Box: ${options.buyBox || "Not provided"}.
      Buyer Budget: ${options.budget || "Not provided"}.
      Closing Timeline: ${options.closingTimeline || "Not provided"}.
      Proof of Funds: ${options.proofOfFunds || "Not provided"}.

      Return in this format:
      1) Phone Script
      2) SMS Version
      3) Email Version
      Keep each short and conversion-focused.`,
    }));

    return response.text;
  } catch (error) {
    console.error("Cash buyer script generation failed:", errorMessage(error));
    return `Hi ${options.buyerName || "there"}, I have an off-market opportunity at ${deal.address} for $${deal.price.toLocaleString()}. If this fits your buy box, I can send details and timeline.`;
  }
};

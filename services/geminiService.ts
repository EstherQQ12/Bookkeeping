
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, ParsedTransaction } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses a natural language string into a structured transaction object.
 */
export const parseTransactionFromText = async (text: string): Promise<ParsedTransaction | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract transaction details from the following text: "${text}". 
      If the text implies spending money, it is an EXPENSE. 
      If it implies receiving money (allowance, gift, work), it is INCOME.
      If no specific date is mentioned, do not invent one (return null for date).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Short description of the item or source" },
            amount: { type: Type.NUMBER, description: "The monetary value" },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            date: { type: Type.STRING, description: "YYYY-MM-DD format if mentioned, else null", nullable: true }
          },
          required: ["description", "amount", "type"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    
    // validation to ensure we match our internal types
    if (!json.description || json.amount === undefined) return null;

    return {
      description: json.description,
      amount: Number(json.amount),
      type: json.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
      date: json.date || undefined
    };

  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    return null;
  }
};

/**
 * Generates a short, friendly financial tip based on recent spending.
 */
export const generateFinancialTip = async (transactions: Transaction[], currency: string = '$'): Promise<string> => {
  if (transactions.length === 0) return "Start adding transactions to get tips!";

  // Summarize for the prompt to save tokens
  const recentTx = transactions.slice(0, 10).map(t => `${t.type}: ${t.amount} on ${t.description}`).join(", ");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on these recent transactions by a student (Currency: ${currency}): [${recentTx}], give one short, friendly, emoji-filled sentence of financial advice or encouragement. Keep it under 20 words.`,
    });
    return response.text || "Keep tracking your spending!";
  } catch (error) {
    return "Stay on top of your budget!";
  }
};

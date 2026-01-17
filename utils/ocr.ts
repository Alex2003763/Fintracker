import { Transaction } from '../types';

// Helper function to convert File to a base64 string
const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string; }; }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result is a data URL like "data:image/jpeg;base64,LzlqLz...".
        // We only need the part after the comma.
        const parts = reader.result.split(',');
        if (parts.length === 2) {
          resolve({
            inlineData: {
              mimeType: file.type,
              data: parts[1],
            },
          });
        } else {
          reject(new Error("Invalid data URL format."));
        }
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};


/**
 * Parses a receipt image using the Gemini API.
 * @param imageFile The image file of the receipt.
 * @returns A promise that resolves to the extracted transaction data.
 */
export const parseReceiptWithGemini = async (
  imageFile: File,
  apiKey: string,
  model: string = 'gemini-2.5-flash-lite'
): Promise<Partial<Omit<Transaction, 'id' | 'date' | 'type'>>> => {
  
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const API_URL = `https://rainbow-gumption-2fc85c.netlify.app/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const imagePart = await fileToGenerativePart(imageFile);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `
              Analyze this receipt image and extract the following information in JSON format:
              1. "description": The name of the merchant or a brief description of the purchase.
              2. "amount": The total amount paid.
              3. "emoji": A single relevant emoji that best represents this transaction (e.g., ☕ for coffee, 🍔 for fast food, 🏪 for groceries, ⛽ for gas, 🎬 for movies, etc.)

              Only return a valid JSON object with these three keys. For example:
              {
                "description": "STARBUCKS",
                "amount": 15.75,
                "emoji": "☕"
              }
              
              Choose the most appropriate emoji that represents the type of transaction or merchant.
            `,
          },
          imagePart,
        ],
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message ?? errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error('Content was blocked due to safety concerns.');
      }
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${data.promptFeedback.blockReason}`);
      }
      throw new Error('Invalid response structure from Gemini API.');
    }

    // Handle markdown-wrapped JSON responses
    let jsonText = text.trim();

    // Check if response is wrapped in markdown code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsedResult = JSON.parse(jsonText);

    if (parsedResult.amount != null && typeof parsedResult.amount !== 'number') {
      parsedResult.amount = parseFloat(String(parsedResult.amount));
    }

    return {
      description: parsedResult.description,
      amount: parsedResult.amount,
      emoji: parsedResult.emoji,
    };

  } catch (e: any) {
    console.error('Error parsing receipt with Gemini:', e);
    throw new Error(`Failed to analyze the receipt. Check your API key, network connection, or model configuration. Error: ${e.message}`);
  }
};
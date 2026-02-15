import { 
  GoogleGenerativeAI, 
  GenerativeModel, 
  GenerationConfig,
  Part
} from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || "";

// Configuration for the model's behavior
const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

/**
 * Service class for interacting with standard Gemini models (Pro/Flash).
 * Handles text and multi-modal analysis.
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(modelName: string = "gemini-1.5-pro") {
    if (!API_KEY) {
      console.warn("GOOGLE_API_KEY is not set. Gemini features will fail.");
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: DEFAULT_CONFIG
    });
  }

  /**
   * Generates content based on a text prompt and optional media parts.
   * @param prompt - The text instruction.
   * @param parts - Array of base64 encoded images or files (optional).
   */
  async analyzeContent(prompt: string, parts: Array<{ mimeType: string; data: string }> = []): Promise<string> {
    try {
      // Convert internal custom part format to SDK expected format
      const contentParts: Part[] = [
        { text: prompt },
        ...parts.map(p => ({
          inlineData: {
            mimeType: p.mimeType,
            data: p.data
          }
        }))
      ];

      const result = await this.model.generateContent(contentParts);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw new Error("Failed to analyze content using Gemini.");
    }
  }

  /**
   * Specialized method for editing or refining text.
   * @param input - The original text.
   * @param instruction - How to modify it (e.g., "Make it more professional").
   */
  async editContent(input: string, instruction: string): Promise<string> {
    const prompt = `Original Text:
"${input}"

Instruction: ${instruction}

Provide only the edited text.`;
    return this.analyzeContent(prompt);
  }
}

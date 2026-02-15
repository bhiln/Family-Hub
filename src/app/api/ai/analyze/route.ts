import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

// Initialize singleton or per-request (Next.js handles module caching)
// Using gemini-1.5-pro by default for robust analysis
const gemini = new GeminiService();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, image } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    // Construct parts array if image exists
    const parts = image ? [{ mimeType: "image/jpeg", data: image }] : [];
    
    const analysis = await gemini.analyzeContent(prompt, parts);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

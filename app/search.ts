import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "What are the state of the art best practices in 2026 for scheduling and sending push notifications in a web app when a user saves an event, specifically to notify them 1 hour before the event starts?",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  console.log(response.text);
}

run().catch(console.error);

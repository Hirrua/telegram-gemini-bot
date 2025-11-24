import dotenv from "dotenv"
dotenv.config()

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  apiKey: process.env.GEMINI_API_KEY,
  systemInstruction: "Você é um assistente chamado MédicoAqui útil especializado em responder dúvidas sobre receituários médicos."
})

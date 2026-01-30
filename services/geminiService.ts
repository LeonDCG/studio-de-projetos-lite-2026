import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const PROMPT_TRANSCRIPTION = `Transcreva este áudio/vídeo integralmente para texto em Português Brasileiro.
Identifique falantes se possível.
Retorne apenas o texto transcrito, sem formatação Markdown.`;

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const transcribeMedia = async (file: File): Promise<string> => {
  try {
    const ai = getAIClient();
    const mediaPart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          mediaPart,
          { text: PROMPT_TRANSCRIPTION }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No transcription generated.");
    return text;

  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const generateMeetingMinutes = async (transcription: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Com base na seguinte transcrição de reunião, gere uma ATA (Minuta) estruturada em Markdown.
      
      A ATA deve conter:
      1. Título sugerido
      2. Data (use a data atual se não mencionada)
      3. Participantes (se identificáveis)
      4. Resumo Geral
      5. Tópicos discutidos
      
      Transcrição:
      ${transcription}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { text: prompt }
    });

    return response.text || "Não foi possível gerar a ATA.";
  } catch (error) {
    console.error("ATA generation error:", error);
    throw error;
  }
};

export const extractMeetingDecisions = async (transcription: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Com base na seguinte transcrição, extraia APENAS as decisões tomadas.
      Retorne uma lista numerada simples. Seja direto e objetivo.
      Não use formatação Markdown complexa (apenas texto plano e números).
      
      Transcrição:
      ${transcription}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { text: prompt }
    });

    return response.text || "Nenhuma decisão identificada.";
  } catch (error) {
    console.error("Decision extraction error:", error);
    throw error;
  }
};

export const queryMeetingContext = async (
  query: string, 
  context: { 
    transcription: string, 
    ata: string | null, 
    decisions: string | null, 
    chatHistory: ChatMessage[] 
  }
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    // Construct context block
    let contextPrompt = `Você é um assistente de IA analisando uma reunião.
    Use o contexto abaixo para responder à pergunta do usuário.\n\n`;

    contextPrompt += `--- TRANSCRICAO ---\n${context.transcription}\n\n`;
    
    if (context.ata) {
      contextPrompt += `--- ATA (Resumo) ---\n${context.ata}\n\n`;
    }
    
    if (context.decisions) {
      contextPrompt += `--- DECISOES TOMADAS ---\n${context.decisions}\n\n`;
    }

    if (context.chatHistory.length > 0) {
      contextPrompt += `--- HISTORICO DO CHAT ---\n`;
      context.chatHistory.forEach(msg => {
        contextPrompt += `${msg.role === 'user' ? 'Usuário' : 'IA'}: ${msg.text}\n`;
      });
      contextPrompt += `\n`;
    }

    contextPrompt += `--- PERGUNTA DO USUÁRIO ---\n${query}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { text: contextPrompt }
    });

    return response.text || "Desculpe, não consegui processar a resposta.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
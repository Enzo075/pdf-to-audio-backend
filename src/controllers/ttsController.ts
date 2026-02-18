import { Request, Response } from "express";
import * as ttsService from "../services/ttsService.js";

export const generateAudio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { text, playbackRate, provider, apiKey } = req.body;

    // Validações
    if (!text || typeof text !== "string") {
      res
        .status(400)
        .json({ error: "Campo 'text' é obrigatório e deve ser string." });
      return;
    }

    if (!playbackRate || typeof playbackRate !== "number") {
      res
        .status(400)
        .json({
          error: "Campo 'playbackRate' é obrigatório e deve ser number.",
        });
      return;
    }

    if (!provider || typeof provider !== "string") {
      res.status(400).json({ error: "Campo 'provider' é obrigatório." });
      return;
    }

    const validProviders = ["openai", "google", "azure"];
    if (!validProviders.includes(provider)) {
      res.status(400).json({
        error: `Provider inválido. Valores aceitos: ${validProviders.join(", ")}`,
      });
      return;
    }

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      res.status(400).json({ error: "Campo 'apiKey' é obrigatório." });
      return;
    }

    // Gera áudio
    const audioBuffer = await ttsService.generateSpeech(
      text,
      playbackRate,
      provider as ttsService.TTSProvider,
      apiKey,
    );

    // Retorna áudio
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error: any) {
    console.error("Erro TTS:", error.message);
    res.status(500).json({ error: error.message });
  }
};

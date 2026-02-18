import OpenAI from "openai";
import axios from "axios";

export type TTSProvider = "openai" | "google" | "azure";

export interface TTSRequest {
  text: string;
  playbackRate: number;
  provider: TTSProvider;
  apiKey: string;
}

/**
 * Gera áudio com OpenAI TTS
 */
const generateWithOpenAI = async (
  text: string,
  speed: number,
  apiKey: string,
): Promise<Buffer> => {
  const openai = new OpenAI({ apiKey });
  const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    speed: clampedSpeed,
  });

  return Buffer.from(await mp3.arrayBuffer());
};

/**
 * Gera áudio com Google Cloud TTS
 */
const generateWithGoogle = async (
  text: string,
  speed: number,
  apiKey: string,
): Promise<Buffer> => {
  const response = await axios.post(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      input: { text },
      voice: {
        languageCode: "pt-BR",
        name: "pt-BR-Wavenet-A",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: Math.max(0.25, Math.min(4.0, speed)),
      },
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return Buffer.from(response.data.audioContent, "base64");
};

/**
 * Gera áudio com Azure TTS
 * apiKey pode ser: "KEY" ou "KEY|REGION" ou "KEY|https://region.tts.speech.microsoft.com"
 */
const generateWithAzure = async (
  text: string,
  speed: number,
  apiKey: string,
): Promise<Buffer> => {
  let key = apiKey;
  let region = "brazilsouth";

  if (apiKey.includes("|")) {
    const parts = apiKey.split("|");
    key = parts[0] || apiKey;
    const regionOrEndpoint = parts[1];

    if (regionOrEndpoint) {
      if (regionOrEndpoint.includes("http")) {
        const match = regionOrEndpoint.match(/https?:\/\/([^.]+)\./);
        region = match?.[1] || "brazilsouth";
      } else {
        region = regionOrEndpoint;
      }
    }
  }

  // Azure usa SSML para controlar velocidade
  const ssml = `
    <speak version='1.0' xml:lang='pt-BR'>
      <voice xml:lang='pt-BR' name='pt-BR-FranciscaNeural'>
        <prosody rate='${speed * 100}%'>
          ${text}
        </prosody>
      </voice>
    </speak>
  `;

  const response = await axios.post(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    ssml,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      responseType: "arraybuffer",
    },
  );

  return Buffer.from(response.data);
};

/**
 * Função principal que roteia para o provider correto
 */
export const generateSpeech = async (
  text: string,
  speed: number,
  provider: TTSProvider,
  apiKey: string,
): Promise<Buffer> => {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key é obrigatória");
  }

  try {
    switch (provider) {
      case "openai":
        return await generateWithOpenAI(text, speed, apiKey);
      case "google":
        return await generateWithGoogle(text, speed, apiKey);
      case "azure":
        return await generateWithAzure(text, speed, apiKey);
      default:
        throw new Error(`Provider inválido: ${provider}`);
    }
  } catch (error: any) {
    if (error.response?.data) {
      const errorData =
        typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
      throw new Error(`Erro ${provider}: ${errorData}`);
    }
    throw new Error(`Erro ao gerar áudio com ${provider}: ${error.message}`);
  }
};

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractText = async (buffer: Buffer): Promise<any> => {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text.replace(/\s+/g, " ").trim(),
      pages: data.numpages,
      info: data.info,
    };
  } catch (error: any) {
    throw new Error("Erro na versão clássica: " + error.message);
  }
};

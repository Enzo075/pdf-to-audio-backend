import { Request, Response } from "express";
import * as pdfService from "../services/pdfService.js";

export const uploadAndExtract = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nenhum arquivo enviado." });
      return;
    }
    const result = await pdfService.extractText(req.file.buffer);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

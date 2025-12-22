import { Request, Response } from "express";
import * as pdfService from "../services/pdfService";

export const uploadAndExtract = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nenhum arquivo PDF enviado." });
      return;
    }

    const extraction = await pdfService.extractText(req.file.buffer);

    res.status(200).json({
      message: "Texto extraído com sucesso",
      data: extraction,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

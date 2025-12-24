import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: any) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos!") as any, false);
    }
  },
});

export default upload.single("pdf");

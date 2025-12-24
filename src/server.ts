import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pdfRoutes from "./routes/pdfRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/pdf", pdfRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", message: "Servidor TTS ativo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Rodando na porta ${PORT}`));

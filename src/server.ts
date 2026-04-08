import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pdfRoutes from "./routes/pdfRoutes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();

const corsOptions = {
  // Substitua pela URL exata do seu frontend rodando no Vite
  origin: "http://localhost:5173",
  credentials: true, // Permite o envio de cookies/headers de autenticação
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pdf", authMiddleware, pdfRoutes);
app.use("/api/tts", authMiddleware, ttsRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", message: "Servidor TTS ativo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

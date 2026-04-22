import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import pdfRoutes from "./routes/pdfRoutes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/api/auth/logout", (_req, res) => {
  res.status(200).json({ message: "Logout realizado com sucesso" });
});

app.use("/api/auth", authRoutes);
app.use("/api/pdf", authMiddleware, pdfRoutes);
app.use("/api/tts", authMiddleware, ttsRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", message: "Servidor TTS ativo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

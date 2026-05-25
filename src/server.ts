import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import { initPassport } from "./lib/passport.js";
import cookieParser from "cookie-parser";
import pdfRoutes from "./routes/pdfRoutes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

import bookRoutes from "./routes/bookRoutes.js";

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

initPassport();
app.use(passport.initialize());

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logout realizado com sucesso" });
});

app.use("/api/auth", authRoutes);
app.use("/api/pdf", authMiddleware, pdfRoutes);
app.use("/api/tts", authMiddleware, ttsRoutes);

app.use("/api/books", authMiddleware, bookRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", message: "Servidor TTS ativo" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

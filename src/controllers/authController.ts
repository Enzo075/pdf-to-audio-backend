import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateTokens, verifyRefreshToken } from "../lib/jwt.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email e password são obrigatórios." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email já cadastrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const tokens = generateTokens({ id: user.id, email: user.email });

    res.status(201).json({
      ...tokens,
      user: { id: user.id, name: null, email: user.email },
    });
  } catch {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email e password são obrigatórios." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const tokens = generateTokens({ id: user.id, email: user.email });

    res.status(200).json({
      ...tokens,
      user: { id: user.id, name: null, email: user.email },
    });
  } catch {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken é obrigatório." });
      return;
    }

    let payload: { id: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: "Refresh token inválido" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ error: "Refresh token inválido" });
      return;
    }

    const tokens = generateTokens({ id: user.id, email: user.email });

    res.status(200).json(tokens);
  } catch {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const me = (req: Request, res: Response): void => {
  res.status(200).json(req.user);
};

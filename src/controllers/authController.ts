import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateTokens, verifyRefreshToken } from "../lib/jwt.js";
import { generateResetToken, hashToken } from "../lib/resetToken.js";
import { sendPasswordResetEmail } from "../lib/resend.js";

// --- REGISTRO ---
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
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- LOGIN ---
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
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- REFRESH TOKEN ---
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
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- PERFIL (ME) ---
export const me = (req: Request, res: Response): void => {
  res.status(200).json(req.user);
};

// --- ESQUECI MINHA SENHA (SOLICITAÇÃO) ---
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email é obrigatório." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const SAFE_MESSAGE =
      "Se o email existir, você receberá as instruções em breve.";

    if (!user) {
      res.status(200).json({ message: SAFE_MESSAGE });
      return;
    }

    const token = generateResetToken();
    const hashed = hashToken(token);
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashed,
        passwordResetExpires: expires,
      },
    });

    console.log(
      "API KEY USADA:",
      process.env.RESEND_API_KEY?.substring(0, 7) + "...",
    );
    const response = await sendPasswordResetEmail(email, token);

    if (response.error) {
      console.error("[RESEND ERROR]:", response.error);
    } else {
      console.log(
        "[RESEND SUCCESS]: E-mail enviado com ID:",
        response.data?.id,
      );
    }

    res.status(200).json({ message: SAFE_MESSAGE });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Erro ao processar solicitação de senha." });
  }
};

// --- REDEFINIR SENHA (EXECUÇÃO) ---
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      res
        .status(400)
        .json({ error: "Dados inválidos ou senha curta demais (mín. 6)." });
      return;
    }

    const hashed = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashed,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: "Token inválido ou expirado." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({ message: "Senha alterada com sucesso." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Erro interno ao redefinir senha." });
  }
};

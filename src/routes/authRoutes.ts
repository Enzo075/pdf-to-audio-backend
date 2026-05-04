import { Router, Request, Response } from "express";
import passport from "passport";
import {
  register,
  login,
  refresh,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { generateTokens } from "../lib/jwt.js";

const router = Router();

// ─── Rotas existentes (não alteradas) ────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Logout realizado com sucesso" });
});

// ─── Google OAuth (não alterado) ──────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google-auth-failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string };

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&userId=${user.id}`,
    );
  },
);

// ─── Microsoft OAuth ──────────────────────────────────────────────────────────
router.get(
  "/microsoft",
  passport.authenticate("microsoft", { session: false }),
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=microsoft-auth-failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string };

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&userId=${user.id}`,
    );
  },
);

export default router;

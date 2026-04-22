import { Router } from "express";
import {
  register,
  login,
  refresh,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout realizado com sucesso" });
});

export default router;

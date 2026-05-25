import { Router } from "express";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import {
  uploadBook,
  listBooks,
  updateProgress,
  reorderBooks,
  removeBook,
  toggleFavorite,
} from "../controllers/bookController.js";

const router = Router();

// POST   /api/books           — upload PDF ± salvar na estante
router.post("/", uploadMiddleware, uploadBook);

// GET    /api/books           — listar livros do usuário (ordenados por position)
router.get("/", listBooks);

// PATCH  /api/books/reorder   — reordenar estante (deve vir ANTES de /:bookId/...)
router.patch("/reorder", reorderBooks);

// PATCH  /api/books/:bookId/progress — atualizar progresso de leitura
router.patch("/:bookId/progress", updateProgress);

// PATCH  /api/books/:bookId/favorite — favoritar ou desfavoritar um livro
router.patch("/:bookId/favorite", toggleFavorite);

// DELETE /api/books/:bookId   — remover livro
router.delete("/:bookId", removeBook);

export default router;

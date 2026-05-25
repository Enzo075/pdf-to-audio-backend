import { Request, Response } from "express";
import * as pdfService from "../services/pdfService.js";
import * as bookService from "../services/bookService.js";

// ─── uploadBook ──────────────────────────────────────────────────────────────
// POST /api/books
// multipart/form-data: campo "pdf" (arquivo) + campo "saveToShelf" (boolean)

export const uploadBook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nenhum arquivo enviado." });
      return;
    }

    const pdfBuffer = req.file.buffer;
    const originalName = Buffer.from(req.file.originalname, "latin1").toString(
      "utf8",
    );

    // Normaliza o valor de saveToShelf vindo do multipart form
    const saveToShelf =
      req.body.saveToShelf === true ||
      req.body.saveToShelf === "true" ||
      req.body.saveToShelf === "1";

    // Extrai o texto do PDF (sempre necessário)
    const extraction = await pdfService.extractText(pdfBuffer);

    if (!saveToShelf) {
      // Comportamento idêntico ao /api/pdf/extract original
      res.json(extraction);
      return;
    }

    // ── Modo estante: salva PDF + capa + registro no banco ──

    const userId = (req.user as { id: string }).id;

    // Conta o total de linhas somando todas as páginas
    const totalLines: number = (extraction.pages as string[][]).reduce(
      (acc: number, page: string[]) => acc + page.length,
      0,
    );

    const totalPages: number = Array.isArray(extraction.pages)
      ? extraction.pages.length
      : 0;

    // Upload para o Supabase Storage
    const { fileUrl, coverUrl } = await bookService.uploadPdfAndCover(
      pdfBuffer,
      originalName,
      userId,
    );

    // Título = nome do arquivo sem extensão
    const title = originalName
      .replace(/\.pdf$/i, "")
      .replace(/_/g, " ")
      .trim();

    // Persiste no banco
    const book = await bookService.createBook({
      title,
      fileUrl,
      coverUrl,
      totalLines,
      totalPages,
      userId,
    });

    res.status(201).json({ extraction, book });
  } catch (error: any) {
    console.error("[uploadBook]", error);
    res.status(500).json({ error: error.message ?? "Erro interno" });
  }
};

// ─── listBooks ───────────────────────────────────────────────────────────────
// GET /api/books

export const listBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const books = await bookService.getUserBooks(userId);
    res.json(books);
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "Erro interno" });
  }
};

// ─── updateProgress ──────────────────────────────────────────────────────────
// PATCH /api/books/:bookId/progress

export const updateProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      res.status(400).json({ error: "O ID do livro é obrigatório." });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const { lastPageRead, lastLineRead } = req.body;

    if (typeof lastPageRead !== "number" || typeof lastLineRead !== "number") {
      res.status(400).json({
        error:
          "lastPageRead e lastLineRead são obrigatórios e devem ser números.",
      });
      return;
    }

    const book = await bookService.updateReadingProgress({
      bookId,
      userId,
      lastPageRead,
      lastLineRead,
    });

    res.json(book);
  } catch (error: any) {
    const status = error.statusCode === 403 ? 403 : 500;
    res.status(status).json({ error: error.message ?? "Erro interno" });
  }
};

// ─── reorderBooks ────────────────────────────────────────────────────────────
// PATCH /api/books/reorder

export const reorderBooks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const { books } = req.body as {
      books: { id: string; position: number }[];
    };

    if (!Array.isArray(books) || books.length === 0) {
      res.status(400).json({ error: "books deve ser um array não vazio." });
      return;
    }

    const updated = await bookService.updateBooksOrder(userId, books);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "Erro interno" });
  }
};

// ─── toggleFavorite ──────────────────────────────────────────────────────────
// PATCH /api/books/:bookId/favorite

export const toggleFavorite = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { bookId } = req.params;
    const userId = (req.user as { id: string }).id;
    const { isFavorite } = req.body;

    if (!bookId) {
      res.status(400).json({ error: "O ID do livro é obrigatório." });
      return;
    }

    if (typeof isFavorite !== "boolean") {
      res.status(400).json({ error: "isFavorite deve ser um valor booleano." });
      return;
    }

    const book = await bookService.toggleFavorite(bookId, userId, isFavorite);
    res.json(book);
  } catch (error: any) {
    const status = error.statusCode === 403 ? 403 : 500;
    res.status(status).json({ error: error.message ?? "Erro interno" });
  }
};

// ─── removeBook ──────────────────────────────────────────────────────────────
// DELETE /api/books/:bookId

export const removeBook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      res.status(400).json({ error: "O ID do livro é obrigatório." });
      return;
    }

    const userId = (req.user as { id: string }).id;

    await bookService.deleteBook(bookId, userId);
    res.status(204).send();
  } catch (error: any) {
    const status = error.statusCode === 403 ? 403 : 500;
    res.status(status).json({ error: error.message ?? "Erro interno" });
  }
};

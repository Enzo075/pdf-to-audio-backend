import prisma from "../lib/prisma";
import supabase from "../lib/supabase";
import { extractCoverFromPdf } from "../lib/pdfCover";

const BUCKET_PDFS = process.env.SUPABASE_BUCKET_PDFS ?? "pdfs";
const BUCKET_COVERS = process.env.SUPABASE_BUCKET_COVERS ?? "covers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Sanitiza o nome do arquivo: remove caracteres especiais, substitui espaços */
function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9._-]/g, "_") // substitui especiais por _
    .replace(/_+/g, "_");
}

/** Gera um nome único prefixado com timestamp */
function uniqueName(original: string): string {
  return `${Date.now()}_${sanitizeFilename(original)}`;
}

/** Extrai o storage path a partir de uma URL pública do Supabase */
function extractStoragePath(publicUrl: string, bucket: string): string {
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return "";
  return publicUrl.slice(idx + marker.length);
}

// ─── uploadPdfAndCover ───────────────────────────────────────────────────────

export async function uploadPdfAndCover(
  pdfBuffer: Buffer,
  originalFilename: string,
  userId: string,
): Promise<{ fileUrl: string; coverUrl: string }> {
  // 1. Upload do PDF
  const pdfUint8Array = new Uint8Array(pdfBuffer);
  const pdfPath = `${userId}/${uniqueName(originalFilename)}`;

  const { error: pdfError } = await supabase.storage
    .from(BUCKET_PDFS)
    .upload(pdfPath, pdfUint8Array, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (pdfError) {
    throw new Error(`Erro ao fazer upload do PDF: ${pdfError.message}`);
  }

  const { data: pdfUrlData } = supabase.storage
    .from(BUCKET_PDFS)
    .getPublicUrl(pdfPath);

  const fileUrl = pdfUrlData.publicUrl;

  // 2. Extração e upload da capa
  let coverUrl = "";

  try {
    const coverBuffer = await extractCoverFromPdf(pdfBuffer);
    const coverFilename = uniqueName(
      originalFilename.replace(/\.pdf$/i, ".png"),
    );
    const coverPath = `${userId}/${coverFilename}`;

    const { error: coverError } = await supabase.storage
      .from(BUCKET_COVERS)
      .upload(coverPath, coverBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (!coverError) {
      const { data: coverUrlData } = supabase.storage
        .from(BUCKET_COVERS)
        .getPublicUrl(coverPath);
      coverUrl = coverUrlData.publicUrl;
    }
  } catch {
    // Capa é opcional — falha silenciosa, o livro é criado sem capa
    console.warn(
      "Não foi possível extrair a capa do PDF — continuando sem ela.",
    );
  }

  return { fileUrl, coverUrl };
}

// ─── createBook ──────────────────────────────────────────────────────────────

export async function createBook(params: {
  title: string;
  fileUrl: string;
  coverUrl: string;
  totalLines: number;
  totalPages: number;
  userId: string;
}) {
  // Determina a próxima posição na estante
  const aggregate = await prisma.book.aggregate({
    where: { userId: params.userId },
    _max: { position: true },
  });

  const nextPosition = (aggregate._max.position ?? -1) + 1;

  return prisma.book.create({
    data: {
      title: params.title,
      fileUrl: params.fileUrl,
      coverUrl: params.coverUrl || null,
      totalLines: params.totalLines,
      totalPages: params.totalPages,
      lastLineRead: 0,
      lastPageRead: 0,
      position: nextPosition,
      userId: params.userId,
    },
  });
}

// ─── getUserBooks ────────────────────────────────────────────────────────────

export async function getUserBooks(userId: string) {
  return prisma.book.findMany({
    where: { userId },
    orderBy: { position: "asc" },
  });
}

// ─── updateReadingProgress ───────────────────────────────────────────────────

export async function updateReadingProgress(params: {
  bookId: string;
  userId: string;
  lastPageRead: number;
  lastLineRead: number;
}) {
  const { bookId, userId, lastPageRead, lastLineRead } = params;

  const existing = await prisma.book.findUnique({ where: { id: bookId } });

  if (!existing || existing.userId !== userId) {
    const err = new Error("Acesso negado");
    (err as any).statusCode = 403;
    throw err;
  }

  return prisma.book.update({
    where: { id: bookId },
    data: { lastPageRead, lastLineRead },
  });
}

// ─── updateBooksOrder ────────────────────────────────────────────────────────

export async function updateBooksOrder(
  userId: string,
  books: { id: string; position: number }[],
) {
  const updates = books.map((b) =>
    prisma.book.updateMany({
      where: { id: b.id, userId },
      data: { position: b.position },
    }),
  );

  await prisma.$transaction(updates);

  return getUserBooks(userId);
}

// ─── toggleFavorite ──────────────────────────────────────────────────────────

export async function toggleFavorite(
  bookId: string,
  userId: string,
  isFavorite: boolean,
) {
  const existing = await prisma.book.findUnique({ where: { id: bookId } });

  if (!existing || existing.userId !== userId) {
    const err = new Error("Acesso negado");
    (err as any).statusCode = 403;
    throw err;
  }

  return prisma.book.update({
    where: { id: bookId },
    data: { isFavorite },
  });
}

// ─── deleteBook ──────────────────────────────────────────────────────────────

export async function deleteBook(bookId: string, userId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });

  if (!book || book.userId !== userId) {
    const err = new Error("Acesso negado");
    (err as any).statusCode = 403;
    throw err;
  }

  // Remove PDF do storage
  const pdfPath = extractStoragePath(book.fileUrl, BUCKET_PDFS);
  if (pdfPath) {
    await supabase.storage.from(BUCKET_PDFS).remove([pdfPath]);
  }

  // Remove capa do storage (opcional — pode não existir)
  if (book.coverUrl) {
    const coverPath = extractStoragePath(book.coverUrl, BUCKET_COVERS);
    if (coverPath) {
      await supabase.storage.from(BUCKET_COVERS).remove([coverPath]);
    }
  }

  // Remove registro do banco
  await prisma.book.delete({ where: { id: bookId } });
}

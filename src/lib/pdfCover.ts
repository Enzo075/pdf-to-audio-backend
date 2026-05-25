import { pdf } from "pdf-to-img";
import sharp from "sharp"; // <--- O import que estava faltando

/**
 * Extrai a primeira página de um PDF como imagem PNG redimensionada.
 * @param pdfBuffer - Buffer do arquivo PDF
 * @returns Buffer PNG da capa (largura máx. 400px)
 */
export async function extractCoverFromPdf(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    const document = await pdf(pdfBuffer, { scale: 2 });

    let firstPage: Buffer | Uint8Array | undefined;

    // O pdf-to-img retorna um iterador, pegamos apenas a primeira iteração
    for await (const page of document) {
      firstPage = page;
      break;
    }

    if (!firstPage) {
      throw new Error("Nenhuma página encontrada no PDF");
    }

    // O Sharp processa o Buffer da imagem gerada
    const pngBuffer = await sharp(firstPage)
      .resize({
        width: 400,
        withoutEnlargement: true, // Não aumenta se a imagem for menor que 400px
      })
      .png()
      .toBuffer();

    return pngBuffer;
  } catch (error: any) {
    console.error("Erro técnico:", error.message);
    throw new Error("Erro ao extrair capa do PDF");
  }
}

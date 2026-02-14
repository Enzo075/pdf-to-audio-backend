import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractText = async (buffer: Buffer): Promise<any> => {
  try {
    const pagesParagraphs: string[][] = [];

    const render_page = async (pageData: any) => {
      const textContent = await pageData.getTextContent();

      const lines: { text: string; y: number }[] = [];

      let lastY: number | null = null;
      let lastX: number | null = null;
      let currentLine = "";

      for (const item of textContent.items) {
        const y = item.transform[5];
        const x = item.transform[4];

        if (lastY === null || y === lastY) {
          if (lastX !== null) {
            const gap = x - lastX;

            if (gap < 5) {
              currentLine += item.str;
            } else {
              currentLine += " " + item.str;
            }
          } else {
            currentLine += item.str;
          }
        } else {
          lines.push({ text: currentLine.trim(), y: lastY });
          currentLine = item.str;
        }

        lastY = y;
        lastX = x + item.width;
      }

      if (currentLine && lastY !== null) {
        lines.push({ text: currentLine.trim(), y: lastY });
      }

      const paragraphs: string[] = [];
      let currentParagraph = "";

      for (let i = 0; i < lines.length; i++) {
        const current = lines[i]!;
        const next = lines[i + 1];

        currentParagraph += current.text + " ";

        if (!next) continue;

        const verticalGap = Math.abs(current.y - next.y);

        if (verticalGap > 25) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = "";
        }
      }

      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }

      pagesParagraphs.push(paragraphs);

      return paragraphs.join("\n\n");
    };

    const options = {
      pagerender: render_page,
    };

    const data = await pdf(buffer, options);

    return {
      pages: pagesParagraphs,
      totalPages: data.numpages,
      info: data.info,
    };
  } catch (error: any) {
    throw new Error("Erro na extração inteligente: " + error.message);
  }
};

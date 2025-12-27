import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractText = async (buffer: Buffer): Promise<any> => {
  try {
    const pagesText: string[] = [];
    const render_page = (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY,
          text = "";
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }
        const cleanedText = text.replace(/\s+/g, " ").trim();
        pagesText.push(cleanedText);
        return text;
      });
    };

    const options = {
      pagerender: render_page,
    };

    const data = await pdf(buffer, options);

    return {
      text: data.text.replace(/\s+/g, " ").trim(),
      pages: pagesText,
      totalPages: data.numpages,
      info: data.info,
    };
  } catch (error: any) {
    throw new Error("Erro na extração por páginas: " + error.message);
  }
};

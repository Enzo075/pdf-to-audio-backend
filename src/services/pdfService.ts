import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractText = async (buffer: Buffer): Promise<any> => {
  try {
    // Array para armazenar o texto de cada página
    const pagesText: string[] = [];

    // Função para capturar o texto página por página
    const render_page = (pageData: any) => {
      // O pagerender é chamado para cada página do PDF
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
        // Limpamos o texto da página e adicionamos ao nosso array
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
      // Mantemos o texto completo para compatibilidade, se necessário
      text: data.text.replace(/\s+/g, " ").trim(),
      // Agora 'pages' retorna o ARRAY de strings que o seu LikeABook precisa
      pages: pagesText,
      totalPages: data.numpages,
      info: data.info,
    };
  } catch (error: any) {
    throw new Error("Erro na extração por páginas: " + error.message);
  }
};

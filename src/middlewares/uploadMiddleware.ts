import multer from "multer";

// Configuração: Armazenar na memória RAM para processamento rápido
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB (definido no seu roadmap)
  },
  fileFilter: (_req, file, cb) => {
    // Validação: Apenas arquivos PDF
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos!") as any, false);
    }
  },
});

export default upload.single("pdf");

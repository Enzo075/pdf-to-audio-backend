import { Router } from "express";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { uploadAndExtract } from "../controllers/pdfController.js";

const router = Router();

router.post("/extract", uploadMiddleware, uploadAndExtract);

export default router;

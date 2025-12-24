import { Router } from "express";
import uploadMiddleware from "../middlewares/uploadMiddleware";
import { uploadAndExtract } from "../controllers/pdfController.js";

const router = Router();

router.post("/extract", uploadMiddleware, uploadAndExtract);

export default router;

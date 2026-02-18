import { Router } from "express";
import { generateAudio } from "../controllers/ttsController.js";

const router = Router();

router.post("/generate", generateAudio);

export default router;

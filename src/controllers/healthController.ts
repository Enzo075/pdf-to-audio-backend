import { Request, Response } from "express";

export const healthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || "development",
  });
};

export const readinessCheck = (_req: Request, res: Response): void => {
  // Aqui você poderia validar conexão com banco no futuro
  res.status(200).json({
    status: "READY",
  });
};

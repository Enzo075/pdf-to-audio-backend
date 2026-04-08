import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
}

export const generateTokens = (user: TokenPayload) => {
  const accessToken = jwt.sign(
    user,
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    } as jwt.SignOptions,
  );

  const refreshToken = jwt.sign(
    user,
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    } as jwt.SignOptions,
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string,
  ) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string,
  ) as TokenPayload;
};

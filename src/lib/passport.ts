import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import prisma from "./prisma.js";

export function initPassport(): void {
  // ─── Google OAuth ──────────────────────────────────────────────────────────
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: "http://localhost:3001/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(
              new Error("Nenhum email retornado pelo Google"),
              undefined,
            );
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          const newUser = await prisma.user.create({
            data: {
              email,
              password: "", // Login social não usa senha
            },
          });

          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );

  // ─── Microsoft OAuth ───────────────────────────────────────────────────────
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID as string,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
        callbackURL: "http://localhost:3001/api/auth/microsoft/callback",
        scope: ["user.read"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: Function,
      ) => {
        try {
          // O Microsoft pode retornar o email em diferentes campos
          const email =
            profile.emails?.[0]?.value ??
            profile._json?.mail ??
            profile._json?.userPrincipalName;

          if (!email) {
            return done(
              new Error("Nenhum email retornado pelo Microsoft"),
              undefined,
            );
          }

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          const newUser = await prisma.user.create({
            data: {
              email,
              password: "", // Login social não usa senha
            },
          });

          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
}

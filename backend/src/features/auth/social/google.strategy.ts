import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../../../config/client.js";
import { env } from "../../../config/env.js";

const generateAccessToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${env.BASE_URL}/auth/google/callback`,
      scope: ["profile", "email"],
      proxy: true, // Important for production behind proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found from Google provider"));
        }

        let user = await prisma.user.findFirst({
          where: {
            accounts: {
              some: {
                provider: "google",
                providerAccountId: profile.id,
              },
            },
          },
          include: { accounts: true },
        });

        if (!user) {
          // Create new user if not exists
          user = await prisma.user.create({
            data: {
              name: profile.displayName || email.split("@")[0],
              email: email,
              avatar: profile.photos?.[0]?.value,
              isVerified: true, // Google emails are verified
              role: "USER",
              accounts: {
                create: {
                  provider: "google",
                  providerAccountId: profile.id,
                  accessToken,
                  refreshToken: refreshToken || null,
                },
              },
            },
            include: { accounts: true },
          });
        } else {
          // Update tokens if user exists
          await prisma.account.updateMany({
            where: {
              provider: "google",
              providerAccountId: profile.id,
            },
            data: {
              accessToken,
              refreshToken: refreshToken || null,
            },
          });
        }

        // Generate tokens (same as email login)
        const accessTokenJwt = generateAccessToken(user.id);
        const refreshTokenJwt = generateRefreshToken(user.id);
        const refreshHash = await bcrypt.hash(refreshTokenJwt, 12);
        const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const existingToken = await prisma.refreshToken.findFirst({
          where: { userId: user.id },
        });

        if (existingToken) {
          await prisma.refreshToken.update({
            where: { id: existingToken.id },
            data: {
              tokenHash: refreshHash,
              expiresAt: refreshTokenExpiresAt,
            },
          });
        } else {
          await prisma.refreshToken.create({
            data: {
              userId: user.id,
              tokenHash: refreshHash,
              expiresAt: refreshTokenExpiresAt,
            },
          });
        }

        return done(null, {
          id: user.id,
          role: user.role,
          accessToken: accessTokenJwt,
          refreshToken: refreshTokenJwt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
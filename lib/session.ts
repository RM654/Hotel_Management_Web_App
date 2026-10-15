
import type { SessionOptions } from "iron-session";

export interface SessionData {
  userName?: string;
}

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error(
    "SESSION_PASSWORD must be at least 32 characters long."
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "hotel_admin_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  },
};

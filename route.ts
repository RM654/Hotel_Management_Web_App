
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import {
  sessionOptions,
  type SessionData,
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const user_name =
      typeof body.user_name === "string"
        ? body.user_name.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!user_name || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT user_name, password
       FROM public.admin
       WHERE user_name = $1`,
      [user_name]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    session.userName = user.user_name;
    await session.save();

    return NextResponse.json({
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { message: "Unable to log in. Please try again." },
      { status: 500 }
    );
  }
}

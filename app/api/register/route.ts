
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

/*export const runtime = "nodejs";*/

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

    if (user_name.length > 50) {
      return NextResponse.json(
        { message: "Username must be 50 characters or fewer." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { message: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    // Hash the password before storing it.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert the user into PostgreSQL.
    await pool.query(
      `INSERT INTO admin (user_name, password)
       VALUES ($1, $2)`,
      [user_name, hashedPassword]
    );

    return NextResponse.json(
      { message: "Registration successful!" },
      { status: 201 }
    );

    
} catch (error: unknown) {
  console.error("Registration failed:", error);

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    console.error("Error code:", error.code);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    console.error("Error details:", error.message);
  }

  return NextResponse.json(
    { message: "Registration failed. Check the server terminal." },
    { status: 500 }
  );
}

}


import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { calculateReceipt } from "@/lib/receipt-calculation";

export async function GET(request: Request) {
  const client = await pool.connect();

  try {
    const url = new URL(request.url);
    const guestId = Number(url.searchParams.get("guest_id"));
    const services = url.searchParams.getAll("service");

    const receipt = await calculateReceipt(
      client,
      guestId,
      services
    );

    const numberResult = await client.query(
      `SELECT nextval(
         pg_get_serial_sequence('public.income', 'receipt_no')
       ) AS receipt_no`
    );

    return NextResponse.json({
      ...receipt,
      receiptNo: String(numberResult.rows[0].receipt_no),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate receipt.";

    console.error("Receipt preview failed:", error);

    const clientError =
      message.includes("not found") ||
      message.includes("Invalid") ||
      message.includes("must be later") ||
      message.includes("No active") ||
      message.includes("missing from the charges");

    return NextResponse.json(
      { message },
      { status: clientError ? 400 : 500 }
    );
  } finally {
    client.release();
  }
}

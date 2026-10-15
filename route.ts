
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { calculateReceipt } from "@/lib/receipt-calculation";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const body = await request.json();
    const guestId = Number(body.guest_id);
    const receiptNo = String(body.receipt_no ?? "");
    const services = body.services;

    if (
      !Number.isSafeInteger(guestId) ||
      guestId <= 0 ||
      !/^[1-9]\d*$/.test(receiptNo) ||
      !Array.isArray(services)
    ) {
      return NextResponse.json(
        { message: "Invalid checkout information." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");
    transactionStarted = true;

    // Serialize checkout attempts for this guest.
    const guestLock = await client.query(
      `SELECT guest_id
       FROM public.guest_details
       WHERE guest_id = $1
       FOR UPDATE`,
      [guestId]
    );

    if (guestLock.rows.length === 0) {
      throw new Error("Guest ID was not found.");
    }

    // Lock this guest's current room assignments.
    const roomLock = await client.query(
      `SELECT room_number
       FROM public.rooms
       WHERE guest_id = $1
       FOR UPDATE`,
      [guestId]
    );

    if (roomLock.rows.length === 0) {
      throw new Error(
        "No active room assignments remain. This guest may already have checked out."
      );
    }

    // Always recalculate on the server.
    const receipt = await calculateReceipt(
      client,
      guestId,
      services
    );

    // Insert the receipt number previewed on the receipt page.
    // OVERRIDING SYSTEM VALUE allows this explicit identity value.
    await client.query(
      `INSERT INTO public.income
         (receipt_no, income_date, amount)
       OVERRIDING SYSTEM VALUE
       VALUES ($1, CURRENT_DATE, $2)`,
      [receiptNo, receipt.total]
    );

    // Release all rooms assigned to this guest.
    await client.query(
      `DELETE FROM public.rooms WHERE guest_id = $1`,
      [guestId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return NextResponse.json({
      message: "Checkout completed successfully.",
      receiptNo,
      total: receipt.total,
    });
  } catch (error: unknown) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    const dbError = error as { code?: string };
    const message =
      error instanceof Error
        ? error.message
        : "Checkout failed.";

    console.error("Checkout failed:", error);

    if (dbError.code === "23505") {
      return NextResponse.json(
        { message: "This receipt number has already been used." },
        { status: 409 }
      );
    }

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

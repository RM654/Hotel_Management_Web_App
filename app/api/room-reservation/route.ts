
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const validRooms = new Set(
  Array.from({ length: 10 }, (_, index) => String(index + 1))
);

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT room_number FROM public.rooms`
    );

    return NextResponse.json({
      occupiedRooms: result.rows.map((row) =>
        String(row.room_number)
      ),
    });
  } catch (error) {
    console.error("Failed to load rooms:", error);

    return NextResponse.json(
      { message: "Unable to load room availability." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let client;

  try {
    const body = await request.json();

    const guestId = Number(body.guest_id);
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const contactNumber =
      typeof body.contact_number === "string"
        ? body.contact_number.trim()
        : "";
    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    const checkInDate = body.check_in_date;
    const checkInTime = body.check_in_time;
    const checkoutDate = body.checkout_date;
    const checkoutTime = body.checkout_time;
    const roomNumbers: unknown = body.room_numbers;

    if (
      !Number.isSafeInteger(guestId) ||
      guestId <= 0 ||
      !name ||
      !contactNumber ||
      !address ||
      !checkInDate ||
      !checkInTime ||
      !checkoutDate ||
      !checkoutTime ||
      !Array.isArray(roomNumbers) ||
      roomNumbers.length === 0
    ) {
      return NextResponse.json(
        { message: "Please complete all guest details and select at least one room." },
        { status: 400 }
      );
    }

    if (
      name.length > 150 ||
      contactNumber.length > 20
    ) {
      return NextResponse.json(
        { message: "The name or contact number is too long." },
        { status: 400 }
      );
    }

    if (
      !roomNumbers.every(
        (room: unknown) =>
          typeof room === "string" && validRooms.has(room)
      ) ||
      new Set(roomNumbers).size !== roomNumbers.length
    ) {
      return NextResponse.json(
        { message: "Select valid rooms numbered 1 through 10." },
        { status: 400 }
      );
    }

    const isValidDate = (value: unknown): value is string => {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return false;
      }

      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    const isValidTime = (value: unknown): value is string =>
      typeof value === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    if (
      !isValidDate(checkInDate) ||
      !isValidDate(checkoutDate) ||
      !isValidTime(checkInTime) ||
      !isValidTime(checkoutTime)
    ) {
      return NextResponse.json(
        { message: "Please enter valid check-in and checkout dates and times." },
        { status: 400 }
      );
    }

    const checkIn = `${checkInDate}T${checkInTime}`;
    const checkout = `${checkoutDate}T${checkoutTime}`;

    // Compare the local date and time values without timezone conversion.
    if (
      checkoutDate < checkInDate ||
      (checkoutDate === checkInDate && checkoutTime <= checkInTime)
    ) {
      return NextResponse.json(
        { message: "Checkout must be later than check-in." },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query("BEGIN");

    // Save the guest's details.
    await client.query(
      `INSERT INTO public.guest_details
       (
         guest_id, name, contact_number, address,
         check_in_date, check_in_time,
         checkout_date, checkout_time
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        guestId,
        name,
        contactNumber,
        address,
        checkInDate,
        checkInTime,
        checkoutDate,
        checkoutTime,
      ]
    );

    // Each room gets its own row with the same guest ID.
    // A room's UNIQUE constraint prevents it from being assigned twice.
    for (const room of roomNumbers as string[]) {
      await client.query(
        `INSERT INTO public.rooms (guest_id, room_number)
         VALUES ($1, $2)`,
        [guestId, room]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Room reservation saved successfully." },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (client) {
      await client.query("ROLLBACK");
    }

    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        {
          message:
            "This guest ID already exists, or one of the selected rooms has already been assigned.",
        },
        { status: 409 }
      );
    }

    if (dbError.code === "23503") {
      return NextResponse.json(
        { message: "The guest ID references an invalid record." },
        { status: 400 }
      );
    }

    console.error("Reservation failed:", error);

    return NextResponse.json(
      { message: "Reservation failed. Please try again." },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}

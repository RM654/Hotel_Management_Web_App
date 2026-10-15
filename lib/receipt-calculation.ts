
import type { PoolClient } from "pg";

const allowedServices = [
  "Gym",
  "Laundry",
  "Extra beverages",
];

export async function calculateReceipt(
  client: PoolClient,
  guestId: number,
  services: string[]
) {
  if (
    !Number.isSafeInteger(guestId) ||
    guestId <= 0
  ) {
    throw new Error("Invalid guest ID.");
  }

  if (
    !Array.isArray(services) ||
    !services.every((service) => allowedServices.includes(service)) ||
    new Set(services).size !== services.length
  ) {
    throw new Error("Invalid additional services.");
  }

  const guestResult = await client.query(
    `SELECT
       guest_id,
       name,
       address,
       contact_number,
       check_in_date::text AS check_in_date,
       check_in_time::text AS check_in_time,
       checkout_date::text AS checkout_date,
       checkout_time::text AS checkout_time
     FROM public.guest_details
     WHERE guest_id = $1`,
    [guestId]
  );

  if (guestResult.rows.length === 0) {
    throw new Error("Guest ID was not found.");
  }

  const guest = guestResult.rows[0];

  const roomsResult = await client.query(
    `SELECT room_number
     FROM public.rooms
     WHERE guest_id = $1
     ORDER BY room_number::integer`,
    [guestId]
  );

  const roomNumbers = roomsResult.rows.map(
    (row) => String(row.room_number)
  );

  if (roomNumbers.length === 0) {
    throw new Error(
      "No active room assignments were found for this guest. The guest may already have checked out."
    );
  }

  const days =
    (Date.parse(`${guest.checkout_date}T00:00:00Z`) -
      Date.parse(`${guest.check_in_date}T00:00:00Z`)) /
    86_400_000;

  if (!Number.isInteger(days) || days < 1) {
    throw new Error(
      "Checkout date must be later than check-in date."
    );
  }

  const requiredCharges = ["Room", ...services];

  const chargeResult = await client.query(
    `SELECT service, charges::text AS charges
     FROM public.charges
     WHERE service = ANY($1::varchar[])`,
    [requiredCharges]
  );

  const chargeMap = new Map<string, number>(
    chargeResult.rows.map(
      (row) => [row.service, Number(row.charges)]
    )
  );

  for (const service of requiredCharges) {
    if (!chargeMap.has(service)) {
      throw new Error(
        `Charge for "${service}" is missing from the charges table.`
      );
    }
  }

  const roomRate = chargeMap.get("Room")!;
  const roomTotal = days * roomRate * roomNumbers.length;

  const serviceItems = services.map((service) => ({
    service,
    charge: chargeMap.get(service)!,
  }));

  const serviceTotal = serviceItems.reduce(
    (sum, item) => sum + item.charge,
    0
  );

  const total = Number(
    (roomTotal + serviceTotal).toFixed(2)
  );

  const dateResult = await client.query(
    `SELECT CURRENT_DATE::text AS current_date`
  );

  return {
    guest,
    roomNumbers,
    numberOfRooms: roomNumbers.length,
    nights: days,
    currentDate: dateResult.rows[0].current_date,
    roomRate,
    roomTotal: Number(roomTotal.toFixed(2)),
    services: serviceItems,
    serviceTotal: Number(serviceTotal.toFixed(2)),
    total,
  };
}

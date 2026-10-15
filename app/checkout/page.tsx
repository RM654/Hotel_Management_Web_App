
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const serviceOptions = [
  "Gym",
  "Laundry",
  "Extra beverages",
];

export default function CheckoutPage() {
  const router = useRouter();
  const [guestId, setGuestId] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function toggleService(service: string) {
    setServices((previous) =>
      previous.includes(service)
        ? previous.filter((item) => item !== service)
        : [...previous, service]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const params = new URLSearchParams();
    params.set("guest_id", guestId);

    for (const service of services) {
      params.append("service", service);
    }

    router.push(`/receipt?${params.toString()}`);
  }

  return (
    <main className="dashboard-container">
      <section className="dashboard-content">
        <h1>Guest Checkout</h1>
        <p>Enter the guest ID and select the services to include.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ margin: "24px 0" }}>
            <label
              htmlFor="guest_id"
              style={{ display: "block", marginBottom: 8 }}
            >
              Guest ID
            </label>

            <input
              id="guest_id"
              type="number"
              min="1"
              step="1"
              required
              value={guestId}
              onChange={(event) => setGuestId(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          <h2>Additional services</h2>
          <p>
            Select the services used by this guest.
          </p>

          {serviceOptions.map((service) => (
            <label
              key={service}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                margin: "16px 0",
              }}
            >
              <input
                type="checkbox"
                checked={services.includes(service)}
                onChange={() => toggleService(service)}
              />
              {service}
            </label>
          ))}

          {message && <p role="status">{message}</p>}

          <button type="submit" style={{ marginTop: 16, padding: 12 }}>
            Generate Receipt
          </button>
        </form>

        <p style={{ marginTop: 24 }}>
          <Link href="/dashboard">Back to Dashboard</Link>
        </p>
      </section>
    </main>
  );
}

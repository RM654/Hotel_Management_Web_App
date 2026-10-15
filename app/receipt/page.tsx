
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ReceiptData = {
  receiptNo: string;
  currentDate: string;
  guest: {
    guest_id: number;
    name: string;
    address: string;
    contact_number: string;
    check_in_date: string;
    check_in_time: string;
    checkout_date: string;
    checkout_time: string;
  };
  roomNumbers: string[];
  numberOfRooms: number;
  nights: number;
  roomRate: number;
  roomTotal: number;
  services: {
    service: string;
    charge: number;
  }[];
  serviceTotal: number;
  total: number;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);

export default function ReceiptPage() {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [message, setMessage] = useState("Loading receipt...");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [completed, setCompleted] = useState(false);
  const started = useRef(false);

  // Read temporary checkout selections from the URL.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function loadReceipt() {
      try {
        const params = new URLSearchParams(window.location.search);
        const guestId = params.get("guest_id");

        if (!guestId) {
          setMessage("Please enter a guest ID from the checkout page.");
          return;
        }

        const response = await fetch(
          `/api/receipt?${params.toString()}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Could not generate the receipt.");
          return;
        }

        setReceipt(data);
        setMessage("");
      } catch {
        setMessage("Unable to load the receipt. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadReceipt();
  }, []);

  async function completeCheckout() {
    if (!receipt || checkingOut || completed) return;

    setCheckingOut(true);
    setMessage("");

    try {
      // Reuse the selected services from the current URL.
      const params = new URLSearchParams(window.location.search);
      const services = params.getAll("service");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guest_id: receipt.guest.guest_id,
          receipt_no: receipt.receiptNo,
          services,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Checkout failed.");
        return;
      }

      setCompleted(true);
      setMessage(
        "Checkout completed successfully. The receipt has been recorded and the rooms are available again."
      );
    } catch {
      setMessage("Unable to complete checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return <main className="dashboard-container"><p>{message}</p></main>;
  }

  if (!receipt) {
    return (
      <main className="dashboard-container">
        <h1>Receipt</h1>
        <p role="status">{message}</p>
        <Link href="/checkout">Return to Checkout</Link>
      </main>
    );
  }

  const { guest } = receipt;

  return (
    <main
      style={{
        maxWidth: 850,
        margin: "30px auto",
        padding: 24,
        color: "#172033",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <h1>Hotel Receipt</h1>
        <p>Receipt No: {receipt.receiptNo}</p>
        <p>Receipt date: {receipt.currentDate}</p>
      </header>

      <section style={{ marginBottom: 28 }}>
        <h2>Guest details</h2>
        <p><strong>Guest ID:</strong> {guest.guest_id}</p>
        <p><strong>Name:</strong> {guest.name}</p>
        <p><strong>Address:</strong> {guest.address}</p>
        <p><strong>Contact number:</strong> {guest.contact_number}</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2>Reservation details</h2>
        <p><strong>Check-in date:</strong> {guest.check_in_date}</p>
        <p><strong>Check-in time:</strong> {guest.check_in_time}</p>
        <p><strong>Checkout date:</strong> {guest.checkout_date}</p>
        <p><strong>Checkout time:</strong> {guest.checkout_time}</p>
        <p><strong>Number of nights:</strong> {receipt.nights}</p>
        <p><strong>Number of rooms:</strong> {receipt.numberOfRooms}</p>
        <p><strong>Room numbers:</strong> {receipt.roomNumbers.join(", ")}</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2>Charges</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
                  Description
                </th>
                <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
                  Calculation
                </th>
                <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td style={{ padding: 10 }}>Room charges</td>
                <td style={{ padding: 10 }}>
                  {receipt.nights} nights × {receipt.numberOfRooms} rooms ×{" "}
                  {money(receipt.roomRate)}
                </td>
                <td style={{ padding: 10 }}>{money(receipt.roomTotal)}</td>
              </tr>

              {receipt.services.map((item) => (
                <tr key={item.service}>
                  <td style={{ padding: 10 }}>{item.service}</td>
                  <td style={{ padding: 10 }}>1 × {money(item.charge)}</td>
                  <td style={{ padding: 10 }}>{money(item.charge)}</td>
                </tr>
              ))}

              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: 12,
                    borderTop: "2px solid #172033",
                    fontWeight: 700,
                  }}
                >
                  Final total
                </td>
                <td
                  style={{
                    padding: 12,
                    borderTop: "2px solid #172033",
                    fontWeight: 700,
                  }}
                >
                  {money(receipt.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {message && (
        <p role="status" aria-live="polite" style={{ margin: "20px 0" }}>
          {message}
        </p>
      )}

      {!completed ? (
        <button
          type="button"
          onClick={completeCheckout}
          disabled={checkingOut}
          style={{
            padding: "13px 24px",
            border: 0,
            borderRadius: 7,
            background: "#1d4ed8",
            color: "white",
            fontWeight: 600,
            cursor: checkingOut ? "wait" : "pointer",
          }}
        >
          {checkingOut ? "Processing..." : "Checkout"}
        </button>
      ) : (
        <p><strong>Checkout completed.</strong></p>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">Back to Dashboard</Link>
      </p>
    </main>
  );
}


"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

const roomNumbers = Array.from(
  { length: 10 },
  (_, index) => String(index + 1)
);

type GuestForm = {
  guest_id: string;
  name: string;
  contact_number: string;
  address: string;
  check_in_date: string;
  check_in_time: string;
  checkout_date: string;
  checkout_time: string;
};

const emptyForm: GuestForm = {
  guest_id: "",
  name: "",
  contact_number: "",
  address: "",
  check_in_date: "",
  check_in_time: "",
  checkout_date: "",
  checkout_time: "",
};

export default function RoomReservationPage() {
  const [currentDate, setCurrentDate] = useState("");
  const [occupiedRooms, setOccupiedRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  async function loadRooms() {
    try {
      const response = await fetch("/api/room-reservation", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load rooms.");
      }

      const data = await response.json();
      setOccupiedRooms(data.occupiedRooms);
    } catch {
      setMessage("Unable to load room availability. Please refresh the page.");
    } finally {
      setLoadingRooms(false);
    }
  }

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
    void loadRooms();
  }, []);

  function updateField(field: keyof GuestForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleRoom(room: string) {
    if (occupiedRooms.includes(room)) {
      return;
    }

    setSelectedRooms((previous) =>
      previous.includes(room)
        ? previous.filter((item) => item !== room)
        : [...previous, room]
    );
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (selectedRooms.length === 0) {
      setMessage("Please select at least one available room.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/room-reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,
          room_numbers: selectedRooms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Reservation failed.");

        if (response.status === 409) {
          await loadRooms();
        }

        return;
      }

      setMessage(data.message);
      setOccupiedRooms((previous) => [
        ...new Set([...previous, ...selectedRooms]),
      ]);
      setSelectedRooms([]);
      setForm({ ...emptyForm });
    } catch {
      setMessage("Could not save the reservation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box" as const,
    fontSize: "15px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  };

  return (
    <main
      style={{
        maxWidth: "950px",
        margin: "30px auto",
        padding: "24px",
        color: "#172033",
      }}
    >
      <p style={{ textAlign: "right", marginBottom: "20px" }}>
        <strong>Current date:</strong>{" "}
        {currentDate || "Loading..."}
      </p>

      <h1 style={{ marginBottom: "28px" }}>
        Room Reservation and Additional Services
      </h1>

      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: "32px" }}>
          <h2>Available rooms</h2>
          <p>Select one or more rooms for this guest.</p>

          {loadingRooms && <p>Loading room availability...</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(72px, 1fr))",
              gap: "12px",
              marginTop: "18px",
            }}
          >
            {roomNumbers.map((room) => {
              const occupied = occupiedRooms.includes(room);
              const selected = selectedRooms.includes(room);

              return (
                <button
                  key={room}
                  type="button"
                  disabled={occupied || loadingRooms}
                  onClick={() => toggleRoom(room)}
                  aria-pressed={selected}
                  title={
                    occupied ? `Room ${room} is booked` : `Select room ${room}`
                  }
                  style={{
                    minHeight: "58px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: occupied
                      ? "#e5e7eb"
                      : selected
                        ? "#bbf7d0"
                        : "#ffffff",
                    color: "#172033",
                    fontSize: "17px",
                    fontWeight: 600,
                    cursor:
                      occupied || loadingRooms
                        ? "not-allowed"
                        : "pointer",
                    opacity: occupied ? 0.6 : 1,
                  }}
                >
                  {room}
                  {occupied ? " ✕" : ""}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: "14px", marginTop: "12px" }}>
            Selected rooms:{" "}
            {selectedRooms.length > 0
              ? selectedRooms.join(", ")
              : "None"}
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>Reservation dates and times</h2>

          <div style={gridStyle}>
            <div>
              <label htmlFor="check_in_date" style={labelStyle}>
                Check-in date
              </label>
              <input
                id="check_in_date"
                type="date"
                required
                value={form.check_in_date}
                onChange={(event) =>
                  updateField("check_in_date", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="checkout_date" style={labelStyle}>
                Checkout date
              </label>
              <input
                id="checkout_date"
                type="date"
                min={form.check_in_date || undefined}
                required
                value={form.checkout_date}
                onChange={(event) =>
                  updateField("checkout_date", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="check_in_time" style={labelStyle}>
                Check-in time
              </label>
              <input
                id="check_in_time"
                type="time"
                required
                value={form.check_in_time}
                onChange={(event) =>
                  updateField("check_in_time", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="checkout_time" style={labelStyle}>
                Checkout time
              </label>
              <input
                id="checkout_time"
                type="time"
                required
                value={form.checkout_time}
                onChange={(event) =>
                  updateField("checkout_time", event.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>Guest details</h2>

          <div style={gridStyle}>
            <div>
              <label htmlFor="guest_id" style={labelStyle}>
                Guest ID
              </label>
              <input
                id="guest_id"
                type="number"
                min="1"
                step="1"
                required
                value={form.guest_id}
                onChange={(event) =>
                  updateField("guest_id", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="name" style={labelStyle}>
                Name
              </label>
              <input
                id="name"
                type="text"
                maxLength={150}
                required
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="contact_number" style={labelStyle}>
                Contact number
              </label>
              <input
                id="contact_number"
                type="tel"
                maxLength={20}
                required
                value={form.contact_number}
                onChange={(event) =>
                  updateField("contact_number", event.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="address" style={labelStyle}>
                Address
              </label>
              <input
                id="address"
                type="text"
                required
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        

        <button
          type="submit"
          disabled={saving || loadingRooms}
          style={{
            padding: "13px 24px",
            border: "none",
            borderRadius: "7px",
            background: "#1d4ed8",
            color: "#ffffff",
            fontWeight: 600,
            cursor: saving || loadingRooms ? "wait" : "pointer",
          }}
        >
          {saving ? "Saving reservation..." : "Save Reservation"}
        </button>

        {message && (
          <p role="status" aria-live="polite" style={{ marginTop: "18px" }}>
            {message}
          </p>
        )}
      </form>

      <p style={{ marginTop: "28px" }}>
        <Link href="/dashboard">Back to Dashboard</Link>
      </p>
    </main>
  );
}


import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import {
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.userName) {
    redirect("/");
  }

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Hotel Management Dashboard</h1>
          <p>Welcome, {session.userName}!</p>
        </div>
        <LogoutButton />
      </header>

      <section className="dashboard-content">
        <h2>Manage Hotel Operations</h2>
        <p>Select an option to continue.</p>

        <div className="dashboard-grid">
          <Link
            href="/room-reservation"
            className="dashboard-card"
          >
            <span className="dashboard-icon">🛏️</span>
            <h3>Room Reservation</h3>
            <p>Manage room bookings.</p>
          </Link>

          <Link
            href="/checkout"
            className="dashboard-card"
          >
            <span className="dashboard-icon">🧾</span>
            <h3>Checkout</h3>
            <p>Manage guest checkout operations.</p>
          </Link>

          <Link
            href="/monthly-income"
            className="dashboard-card"
          >
            <span className="dashboard-icon">📊</span>
            <h3>Monthly Income</h3>
            <p>View monthly hotel income.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

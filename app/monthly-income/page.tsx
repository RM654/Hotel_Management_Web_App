
import pool from "@/lib/db";
import Link from "next/link";

type MonthlyIncome = {
  month: string;
  total_income: string;
};

export default async function MonthlyIncomePage() {
  const result = await pool.query<MonthlyIncome>(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', income_date), 'FMMonth YYYY') AS month,
      SUM(amount)::numeric(12, 2)::text AS total_income
    FROM public.income
    GROUP BY DATE_TRUNC('month', income_date)
    ORDER BY DATE_TRUNC('month', income_date) DESC;
  `);

  const monthlyIncome = result.rows;

  return (
    <main className="monthly-income-container">
      <Link href="/dashboard" className="back-dashboard-button">
        ← Back to Dashboard
      </Link>

      <h1>Monthly Income</h1>
      <p>Total income received from hotel checkouts, grouped by month.</p>

      {monthlyIncome.length === 0 ? (
        <p>No income records are available yet.</p>
      ) : (
        <table className="income-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Income (LKR)</th>
            </tr>
          </thead>

          <tbody>
            {monthlyIncome.map((item) => (
              <tr key={item.month}>
                <td>{item.month.trim()}</td>
                <td>
                  {Number(item.total_income).toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

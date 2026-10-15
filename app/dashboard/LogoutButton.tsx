
"use client";

export default function LogoutButton() {
  async function handleLogout() {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    if (response.ok || response.redirected) {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="logout-button"
    >
      Logout
    </button>
  );
}

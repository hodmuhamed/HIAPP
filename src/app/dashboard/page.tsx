import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-4 text-gray-700">
          Prijavljen: {user.fullName} ({user.role})
        </p>
        <div className="mt-6 space-y-2">
          <a className="block text-sm font-medium text-gray-900 underline" href="/requests">
            Pregled zahtjeva
          </a>
          {user.role === "ADMIN" ? (
            <a className="block text-sm font-medium text-gray-900 underline" href="/admin">
              Admin sekcija
            </a>
          ) : null}
        </div>
        <form action="/api/auth/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

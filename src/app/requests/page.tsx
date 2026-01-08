import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

export default async function RequestsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
        <p className="mt-4 text-gray-700">
          Lista zahtjeva će biti dostupna uskoro.
        </p>
      </div>
    </div>
  );
}

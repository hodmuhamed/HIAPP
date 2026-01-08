import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
        <div className="mt-4 space-y-2">
          <Link
            href="/admin/request-types"
            className="block text-sm font-medium text-gray-900 underline"
          >
            Request types
          </Link>
          <Link
            href="/admin/assignments"
            className="block text-sm font-medium text-gray-900 underline"
          >
            Assignments
          </Link>
        </div>
      </div>
    </div>
  );
}

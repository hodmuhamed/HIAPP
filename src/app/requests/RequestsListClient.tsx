"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RequestSummary = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  type: { name: string; visibilityPolicy: string };
  createdBy: { fullName: string };
  assignedTo: { fullName: string } | null;
  recipient: { fullName: string } | null;
};

export default function RequestsListClient() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/requests");
        if (!response.ok) {
          throw new Error("Failed to load requests");
        }
        const data = (await response.json()) as RequestSummary[];
        setRequests(data);
      } catch (err) {
        console.error(err);
        setError("Neuspješno učitavanje zahtjeva.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Zahtjevi</h1>
          <Link
            href="/requests/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            Novi zahtjev
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-gray-600">Učitavanje...</p>
        ) : null}
        {error ? (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error ? (
          <div className="mt-6 space-y-4">
            {requests.length === 0 ? (
              <p className="text-sm text-gray-600">Nema dostupnih zahtjeva.</p>
            ) : (
              requests.map((requestItem) => (
                <div
                  key={requestItem.id}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {requestItem.title}
                    </h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {requestItem.type.name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {requestItem.status}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {requestItem.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Kreirao: {requestItem.createdBy.fullName}
                  </p>
                  {requestItem.recipient ? (
                    <p className="text-sm text-gray-600">
                      Recipient: {requestItem.recipient.fullName}
                    </p>
                  ) : null}
                  {requestItem.assignedTo ? (
                    <p className="text-sm text-gray-600">
                      Zadužen: {requestItem.assignedTo.fullName}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

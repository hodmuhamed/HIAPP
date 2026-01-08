"use client";

import { useEffect, useState } from "react";

const policyOptions = [
  "ADMIN_ONLY",
  "DIRECT_PARTICIPANTS",
  "ADMIN_AND_HANDLERS",
  "TEAM_PUBLIC",
] as const;

type RequestType = {
  id: string;
  name: string;
  slug: string;
  visibilityPolicy: (typeof policyOptions)[number];
  requiresRecipient: boolean;
  requiresAssignment: boolean;
};

export default function RequestTypesClient() {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/request-types");
        if (!response.ok) {
          throw new Error("Failed to load");
        }
        const data = (await response.json()) as RequestType[];
        setTypes(data);
      } catch (err) {
        console.error(err);
        setError("Neuspješno učitavanje tipova.");
      }
    };

    void load();
  }, []);

  const updateType = async (type: RequestType) => {
    setSavingId(type.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/request-types/${type.id}` as const, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: type.name,
          visibilityPolicy: type.visibilityPolicy,
          requiresRecipient: type.requiresRecipient,
          requiresAssignment: type.requiresAssignment,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Update failed");
      }
    } catch (err) {
      console.error(err);
      setError("Neuspješno spremanje tipa.");
    } finally {
      setSavingId(null);
    }
  };

  const updateTypeState = (id: string, patch: Partial<RequestType>) => {
    setTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...type, ...patch } : type)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Request types</h1>
        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          {types.map((type) => (
            <div key={type.id} className="rounded-md border border-gray-200 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor={`name-${type.id}`}>
                    Name
                  </label>
                  <input
                    id={`name-${type.id}`}
                    value={type.name}
                    onChange={(event) =>
                      updateTypeState(type.id, { name: event.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor={`policy-${type.id}`}
                  >
                    Policy
                  </label>
                  <select
                    id={`policy-${type.id}`}
                    value={type.visibilityPolicy}
                    onChange={(event) =>
                      updateTypeState(type.id, {
                        visibilityPolicy: event.target.value as RequestType["visibilityPolicy"],
                      })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
                  >
                    {policyOptions.map((policy) => (
                      <option key={policy} value={policy}>
                        {policy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={type.requiresRecipient}
                    onChange={(event) =>
                      updateTypeState(type.id, {
                        requiresRecipient: event.target.checked,
                      })
                    }
                  />
                  requiresRecipient
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={type.requiresAssignment}
                    onChange={(event) =>
                      updateTypeState(type.id, {
                        requiresAssignment: event.target.checked,
                      })
                    }
                  />
                  requiresAssignment
                </label>
              </div>
              <button
                type="button"
                onClick={() => updateType(type)}
                disabled={savingId === type.id}
                className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingId === type.id ? "Spremanje..." : "Spremi"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

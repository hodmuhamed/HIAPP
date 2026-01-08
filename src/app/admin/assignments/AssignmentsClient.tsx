"use client";

import { useEffect, useMemo, useState } from "react";

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type Assignment = {
  id: string;
  userId: string;
  isPrimary: boolean;
  user: { fullName: string; email: string };
};

type RequestType = {
  id: string;
  name: string;
  slug: string;
  assignees: Assignment[];
};

export default function AssignmentsClient() {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingTypeId, setSavingTypeId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Record<string, string>>({});
  const [primaryFlags, setPrimaryFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [typesResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/assignments"),
          fetch("/api/users"),
        ]);

        if (!typesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load assignments");
        }

        const [typesData, usersData] = (await Promise.all([
          typesResponse.json(),
          usersResponse.json(),
        ])) as [RequestType[], UserOption[]];

        setTypes(typesData);
        setUsers(usersData);
      } catch (err) {
        console.error(err);
        setError("Neuspješno učitavanje assign-menta.");
      }
    };

    void load();
  }, []);

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: `${user.fullName} (${user.role})` })),
    [users],
  );

  const handleSave = async (typeId: string) => {
    const userId = selectedUser[typeId];
    if (!userId) {
      setError("Odaberi korisnika.");
      return;
    }

    setSavingTypeId(typeId);
    setError(null);

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          userId,
          isPrimary: primaryFlags[typeId] ?? false,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Save failed");
      }

      const updatedAssignment = (await response.json()) as Assignment;
      setTypes((prev) =>
        prev.map((type) => {
          if (type.id !== typeId) {
            return type;
          }
          const existing = type.assignees.find(
            (assignee) => assignee.userId === updatedAssignment.userId,
          );
          const updatedAssignees = existing
            ? type.assignees.map((assignee) =>
                assignee.userId === updatedAssignment.userId
                  ? { ...assignee, isPrimary: updatedAssignment.isPrimary }
                  : primaryFlags[typeId]
                    ? { ...assignee, isPrimary: false }
                    : assignee,
              )
            : [...type.assignees, updatedAssignment];

          return { ...type, assignees: updatedAssignees };
        }),
      );
    } catch (err) {
      console.error(err);
      setError("Neuspješno spremanje assign-menta.");
    } finally {
      setSavingTypeId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          {types.map((type) => (
            <div key={type.id} className="rounded-md border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">{type.name}</h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {type.assignees.length === 0 ? (
                  <p>Nema assignees.</p>
                ) : (
                  type.assignees.map((assignee) => (
                    <p key={assignee.id}>
                      {assignee.user.fullName} ({assignee.user.email})
                      {assignee.isPrimary ? " • primary" : ""}
                    </p>
                  ))
                )}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor={`assignee-${type.id}`}
                  >
                    Dodaj assignee
                  </label>
                  <select
                    id={`assignee-${type.id}`}
                    value={selectedUser[type.id] ?? ""}
                    onChange={(event) =>
                      setSelectedUser((prev) => ({
                        ...prev,
                        [type.id]: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
                  >
                    <option value="">Odaberi korisnika</option>
                    {userOptions.map((user) => (
                      <option key={user.value} value={user.value}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`primary-${type.id}`}
                    type="checkbox"
                    checked={primaryFlags[type.id] ?? false}
                    onChange={(event) =>
                      setPrimaryFlags((prev) => ({
                        ...prev,
                        [type.id]: event.target.checked,
                      }))
                    }
                  />
                  <label htmlFor={`primary-${type.id}`} className="text-sm text-gray-700">
                    Set as primary
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSave(type.id)}
                disabled={savingTypeId === type.id}
                className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTypeId === type.id ? "Spremanje..." : "Spremi"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

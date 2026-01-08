"use client";

import { useEffect, useMemo, useState } from "react";

const policyOptions = [
  "ADMIN_ONLY",
  "DIRECT_PARTICIPANTS",
  "ADMIN_AND_HANDLERS",
  "TEAM_PUBLIC",
] as const;

type Assignment = {
  id: string;
  userId: string;
  isPrimary: boolean;
  user: { id: string; fullName: string; email: string; role: string };
};

type RequestType = {
  id: string;
  name: string;
  slug: string;
  visibilityPolicy: (typeof policyOptions)[number];
  requiresRecipient: boolean;
  requiresAssignment: boolean;
  assignees: Assignment[];
};

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type AssignmentSelection = { userId: string; isPrimary: boolean };

type NewTypeState = {
  name: string;
  slug: string;
  visibilityPolicy: RequestType["visibilityPolicy"];
  requiresRecipient: boolean;
  requiresAssignment: boolean;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function RequestTypesClient() {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignmentSelections, setAssignmentSelections] = useState<
    Record<string, AssignmentSelection>
  >({});
  const [createSlugEdited, setCreateSlugEdited] = useState(false);
  const [newType, setNewType] = useState<NewTypeState>({
    name: "",
    slug: "",
    visibilityPolicy: "TEAM_PUBLIC",
    requiresRecipient: false,
    requiresAssignment: false,
  });

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.fullName} (${user.role})`,
      })),
    [users],
  );

  const loadData = async () => {
    try {
      const [typesResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/request-types"),
        fetch("/api/users"),
      ]);

      if (!typesResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to load data");
      }

      const [typesData, usersData] = (await Promise.all([
        typesResponse.json(),
        usersResponse.json(),
      ])) as [RequestType[], UserOption[]];

      setTypes(typesData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      setError("Neuspješno učitavanje podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateTypeState = (id: string, patch: Partial<RequestType>) => {
    setTypes((prev) => prev.map((type) => (type.id === id ? { ...type, ...patch } : type)));
  };

  const upsertAssignmentState = (typeId: string, assignment: Assignment) => {
    setTypes((prev) =>
      prev.map((type) => {
        if (type.id !== typeId) {
          return type;
        }

        const existing = type.assignees.find((assignee) => assignee.userId === assignment.userId);
        let assignees = existing
          ? type.assignees.map((assignee) =>
              assignee.userId === assignment.userId ? assignment : assignee,
            )
          : [...type.assignees, assignment];

        if (assignment.isPrimary) {
          assignees = assignees.map((assignee) => ({
            ...assignee,
            isPrimary: assignee.userId === assignment.userId,
          }));
        }

        return { ...type, assignees };
      }),
    );
  };

  const createType = async () => {
    setCreating(true);
    setError(null);

    const payload = {
      ...newType,
      slug: newType.slug ? slugify(newType.slug) : slugify(newType.name),
    };

    try {
      const response = await fetch("/api/admin/request-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Create failed");
      }

      const created = (await response.json()) as RequestType;
      setTypes((prev) => [...prev, created]);
      setNewType({
        name: "",
        slug: "",
        visibilityPolicy: "TEAM_PUBLIC",
        requiresRecipient: false,
        requiresAssignment: false,
      });
      setCreateSlugEdited(false);
    } catch (err) {
      console.error(err);
      setError("Neuspješno kreiranje tipa.");
    } finally {
      setCreating(false);
    }
  };

  const saveType = async (type: RequestType) => {
    setSavingId(type.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/request-types/${type.id}` as const, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Update failed");
      }

      const updated = (await response.json()) as RequestType;
      setTypes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      console.error(err);
      setError("Neuspješno spremanje tipa.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteType = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/request-types/${id}` as const, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Delete failed");
      }

      setTypes((prev) => prev.filter((type) => type.id !== id));
    } catch (err) {
      console.error(err);
      setError("Brisanje nije uspjelo.");
    } finally {
      setDeletingId(null);
    }
  };

  const mutateAssignment = async (typeId: string, selection: AssignmentSelection) => {
    if (!selection.userId) {
      setError("Odaberi korisnika za dodjelu.");
      return;
    }

    setSavingId(typeId);
    setError(null);

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          userId: selection.userId,
          isPrimary: selection.isPrimary,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Save failed");
      }

      const assignment = (await response.json()) as Assignment;
      upsertAssignmentState(typeId, assignment);
      setAssignmentSelections((prev) => ({
        ...prev,
        [typeId]: { userId: "", isPrimary: false },
      }));
    } catch (err) {
      console.error(err);
      setError("Neuspješno spremanje assign-menta.");
    } finally {
      setSavingId(null);
    }
  };

  const removeAssignment = async (typeId: string, userId: string) => {
    setSavingId(typeId);
    setError(null);

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeId, userId }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Delete failed");
      }

      setTypes((prev) =>
        prev.map((type) =>
          type.id === typeId
            ? { ...type, assignees: type.assignees.filter((assignee) => assignee.userId !== userId) }
            : type,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Neuspješno brisanje dodjele.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Request types</h1>
            <p className="text-sm text-gray-600">Upravljanje tipovima, pravilima vidljivosti i dodjelama.</p>
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-8 rounded-md border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Dodaj novi tip</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="new-name">
                Naziv
              </label>
              <input
                id="new-name"
                value={newType.name}
                onChange={(event) =>
                  setNewType((prev) => {
                    const nextName = event.target.value;
                    return {
                      ...prev,
                      name: nextName,
                      slug: createSlugEdited ? prev.slug : slugify(nextName),
                    };
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="new-slug">
                Slug
              </label>
              <input
                id="new-slug"
                value={newType.slug}
                onChange={(event) => {
                  setCreateSlugEdited(true);
                  setNewType((prev) => ({ ...prev, slug: event.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="new-policy">
                Pravilo vidljivosti
              </label>
              <select
                id="new-policy"
                value={newType.visibilityPolicy}
                onChange={(event) =>
                  setNewType((prev) => ({
                    ...prev,
                    visibilityPolicy: event.target.value as RequestType["visibilityPolicy"],
                  }))
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
            <div className="flex flex-wrap gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newType.requiresRecipient}
                  onChange={(event) =>
                    setNewType((prev) => ({ ...prev, requiresRecipient: event.target.checked }))
                  }
                />
                Requires recipient
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newType.requiresAssignment}
                  onChange={(event) =>
                    setNewType((prev) => ({ ...prev, requiresAssignment: event.target.checked }))
                  }
                />
                Requires assignment
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={createType}
            disabled={creating || !newType.name}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? "Kreiranje..." : "Dodaj tip"}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {types.map((type) => {
            const selection = assignmentSelections[type.id] ?? { userId: "", isPrimary: false };

            return (
              <div key={type.id} className="rounded-md border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveType(type)}
                      disabled={savingId === type.id}
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingId === type.id ? "Spremanje..." : "Spremi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteType(type.id)}
                      disabled={deletingId === type.id}
                      className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === type.id ? "Brisanje..." : "Obriši"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor={`name-${type.id}`}>
                      Name
                    </label>
                    <input
                      id={`name-${type.id}`}
                      value={type.name}
                      onChange={(event) => updateTypeState(type.id, { name: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor={`slug-${type.id}`}>
                      Slug
                    </label>
                    <input
                      id={`slug-${type.id}`}
                      value={type.slug}
                      onChange={(event) =>
                        updateTypeState(type.id, { slug: slugify(event.target.value) })
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={type.requiresRecipient}
                        onChange={(event) =>
                          updateTypeState(type.id, { requiresRecipient: event.target.checked })
                        }
                      />
                      requiresRecipient
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={type.requiresAssignment}
                        onChange={(event) =>
                          updateTypeState(type.id, { requiresAssignment: event.target.checked })
                        }
                      />
                      requiresAssignment
                    </label>
                  </div>
                </div>

                <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Dodjele handlera</h4>
                      <p className="text-xs text-gray-600">
                        ADMIN_AND_HANDLERS tipovi zahtijevaju barem jednog dodijeljenog korisnika.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-800">
                    {type.assignees.length === 0 ? (
                      <p className="text-gray-600">Nema dodjela.</p>
                    ) : (
                      type.assignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex flex-wrap items-center justify-between rounded border border-gray-200 bg-white px-3 py-2"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{assignee.user.fullName}</p>
                            <p className="text-xs text-gray-600">
                              {assignee.user.email} • {assignee.user.role}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {assignee.isPrimary ? (
                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                Primary
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() =>
                                mutateAssignment(type.id, { userId: assignee.userId, isPrimary: true })
                              }
                              disabled={savingId === type.id}
                              className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Postavi primary
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAssignment(type.id, assignee.userId)}
                              disabled={savingId === type.id}
                              className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Ukloni
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700"
                        htmlFor={`assignee-${type.id}`}
                      >
                        Dodaj handlera
                      </label>
                      <select
                        id={`assignee-${type.id}`}
                        value={selection.userId}
                        onChange={(event) =>
                          setAssignmentSelections((prev) => ({
                            ...prev,
                            [type.id]: { ...(prev[type.id] ?? { isPrimary: false }), userId: event.target.value },
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
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id={`primary-${type.id}`}
                        type="checkbox"
                        checked={selection.isPrimary}
                        onChange={(event) =>
                          setAssignmentSelections((prev) => ({
                            ...prev,
                            [type.id]: {
                              ...(prev[type.id] ?? { userId: "" }),
                              isPrimary: event.target.checked,
                            },
                          }))
                        }
                      />
                      <label htmlFor={`primary-${type.id}`} className="text-sm text-gray-700">
                        Postavi primary
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => mutateAssignment(type.id, selection)}
                    disabled={savingId === type.id}
                    className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingId === type.id ? "Spremanje..." : "Dodaj / ažuriraj dodjelu"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

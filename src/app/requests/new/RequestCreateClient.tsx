"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RequestType = {
  id: string;
  name: string;
  slug: string;
  requiresRecipient: boolean;
  requiresAssignment: boolean;
};

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function RequestCreateClient() {
  const router = useRouter();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [typeId, setTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [recipientId, setRecipientId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [typesResponse, usersResponse] = await Promise.all([
          fetch("/api/request-types"),
          fetch("/api/users"),
        ]);

        if (!typesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load form data");
        }

        const [typesData, usersData] = (await Promise.all([
          typesResponse.json(),
          usersResponse.json(),
        ])) as [RequestType[], UserOption[]];

        setTypes(typesData);
        setUsers(usersData);
        if (typesData.length > 0) {
          setTypeId(typesData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Neuspješno učitavanje podataka.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const selectedType = useMemo(
    () => types.find((type) => type.id === typeId) ?? null,
    [types, typeId],
  );

  useEffect(() => {
    if (!selectedType?.requiresRecipient) {
      setRecipientId("");
    }
  }, [selectedType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          title,
          description,
          priority,
          recipientId: recipientId || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Greška pri kreiranju zahtjeva.");
        return;
      }

      router.push("/requests");
    } catch {
      setError("Greška pri kreiranju zahtjeva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error && types.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Novi zahtjev</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="typeId">
              Tip zahtjeva
            </label>
            <select
              id="typeId"
              name="typeId"
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="title">
              Naslov
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="description"
            >
              Opis
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              rows={4}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="priority"
            >
              Prioritet
            </label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          {selectedType?.requiresRecipient ? (
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="recipientId"
              >
                Recipient
              </label>
              <select
                id="recipientId"
                name="recipientId"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">Odaberi korisnika</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Kreiranje..." : "Kreiraj zahtjev"}
          </button>
        </form>
      </div>
    </div>
  );
}

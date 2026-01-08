import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import RequestsListClient from "./RequestsListClient";

export default async function RequestsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <RequestsListClient />;
}

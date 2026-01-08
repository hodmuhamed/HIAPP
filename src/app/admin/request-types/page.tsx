import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import RequestTypesClient from "./RequestTypesClient";

export default async function RequestTypesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <RequestTypesClient />;
}

import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import RequestCreateClient from "./RequestCreateClient";

export default async function NewRequestPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <RequestCreateClient />;
}

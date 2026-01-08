import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import AssignmentsClient from "./AssignmentsClient";

export default async function AssignmentsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AssignmentsClient />;
}

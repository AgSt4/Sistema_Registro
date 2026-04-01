import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";

export async function requireUser() {
  const auth = await getAuthState();

  if (!auth.user) {
    redirect("/login");
  }

  return auth;
}

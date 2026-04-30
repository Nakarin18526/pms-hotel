import { auth } from "@/auth";
import { api, ApiOptions } from "./api";

export async function adminApi<T = any>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const session = await auth();
  const token = (session as any)?.apiToken;
  if (!token) throw new Error("not authenticated");
  return api<T>(path, { ...opts, token });
}

export async function getAdminToken() {
  const session = await auth();
  return (session as any)?.apiToken as string | undefined;
}

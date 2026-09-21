import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";
import type { SuccessStatusCode } from "hono/utils/http-status";
import type { AppType } from "@proj/server";
import type {
  Blueshift,
  BlueshiftStar,
  CreateBlueshift,
  CreateBlueshiftStar,
  CreateRedshift,
  CreateRedshiftStar,
  Redshift,
  RedshiftStar,
  Settings,
  UpdateBlueshift,
  UpdateBlueshiftStar,
  UpdateRedshift,
  UpdateRedshiftStar,
} from "@proj/shared";

interface ClerkSession {
  getToken: () => Promise<string | null>;
}

async function sessionToken(): Promise<string | null> {
  const clerk = (globalThis as { Clerk?: { session?: ClerkSession | null } }).Clerk;
  if (clerk?.session === null || clerk?.session === undefined) return null;
  const token = await clerk.session.getToken();
  return token;
}

const client = hc<AppType>("/", {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const token = await sessionToken();
    if (token !== null) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  },
});

type SuccessResponseOf<R> =
  R extends ClientResponse<infer T, infer S, infer F>
    ? S extends SuccessStatusCode
      ? ClientResponse<T, S, F>
      : never
    : never;

type Unwrapped<R> = SuccessResponseOf<R> extends ClientResponse<infer T, infer _S, infer _F> ? T : never;

async function unwrap<R extends ClientResponse<unknown>>(response: R): Promise<Unwrapped<R>> {
  if (!response.ok) throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
  if (response.status === 204) return undefined as Unwrapped<R>;
  const body = await (response as SuccessResponseOf<R>).json();
  return body as Unwrapped<R>;
}

export async function listBlueshifts(): Promise<Blueshift[]> {
  const response = await client.api.blueshifts.$get();
  const rows = await unwrap(response);
  return rows;
}

export async function createBlueshift(input: CreateBlueshift): Promise<Blueshift> {
  const response = await client.api.blueshifts.$post({ json: input });
  const created = await unwrap(response);
  return created;
}

export async function updateBlueshift(id: string, input: UpdateBlueshift): Promise<Blueshift> {
  const response = await client.api.blueshifts[":id"].$patch({ param: { id }, json: input });
  const updated = await unwrap(response);
  return updated;
}

export async function deleteBlueshift(id: string): Promise<void> {
  const response = await client.api.blueshifts[":id"].$delete({ param: { id } });
  await unwrap(response);
}

export async function listBlueshiftStars(blueshiftId: string): Promise<BlueshiftStar[]> {
  const response = await client.api.blueshifts[":id"].stars.$get({ param: { id: blueshiftId } });
  const rows = await unwrap(response);
  return rows;
}

export async function createBlueshiftStar(blueshiftId: string, input: CreateBlueshiftStar): Promise<BlueshiftStar> {
  const response = await client.api.blueshifts[":id"].stars.$post({ param: { id: blueshiftId }, json: input });
  const created = await unwrap(response);
  return created;
}

export async function updateBlueshiftStar(id: string, input: UpdateBlueshiftStar): Promise<BlueshiftStar> {
  const response = await client.api.blueshifts.stars[":id"].$patch({ param: { id }, json: input });
  const updated = await unwrap(response);
  return updated;
}

export async function deleteBlueshiftStar(id: string): Promise<void> {
  const response = await client.api.blueshifts.stars[":id"].$delete({ param: { id } });
  await unwrap(response);
}

export async function listRedshifts(): Promise<Redshift[]> {
  const response = await client.api.redshifts.$get();
  const rows = await unwrap(response);
  return rows;
}

export async function createRedshift(input: CreateRedshift): Promise<Redshift> {
  const response = await client.api.redshifts.$post({ json: input });
  const created = await unwrap(response);
  return created;
}

export async function updateRedshift(id: string, input: UpdateRedshift): Promise<Redshift> {
  const response = await client.api.redshifts[":id"].$patch({ param: { id }, json: input });
  const updated = await unwrap(response);
  return updated;
}

export async function deleteRedshift(id: string): Promise<void> {
  const response = await client.api.redshifts[":id"].$delete({ param: { id } });
  await unwrap(response);
}

export async function listRedshiftStars(redshiftId: string): Promise<RedshiftStar[]> {
  const response = await client.api.redshifts[":id"].stars.$get({ param: { id: redshiftId } });
  const rows = await unwrap(response);
  return rows;
}

export async function createRedshiftStar(redshiftId: string, input: CreateRedshiftStar): Promise<RedshiftStar> {
  const response = await client.api.redshifts[":id"].stars.$post({ param: { id: redshiftId }, json: input });
  const created = await unwrap(response);
  return created;
}

export async function updateRedshiftStar(id: string, input: UpdateRedshiftStar): Promise<RedshiftStar> {
  const response = await client.api.redshifts.stars[":id"].$patch({ param: { id }, json: input });
  const updated = await unwrap(response);
  return updated;
}

export async function deleteRedshiftStar(id: string): Promise<void> {
  const response = await client.api.redshifts.stars[":id"].$delete({ param: { id } });
  await unwrap(response);
}

export async function listNorthStars(): Promise<BlueshiftStar[]> {
  const response = await client.api["north-stars"].$get();
  const rows = await unwrap(response);
  return rows;
}

export async function getSettings(): Promise<Settings> {
  const response = await client.api.settings.$get();
  const settings = await unwrap(response);
  return settings;
}

export async function updateSettings(input: { readonly timezone: string | null }): Promise<Settings> {
  const response = await client.api.settings.$patch({ json: input });
  const settings = await unwrap(response);
  return settings;
}

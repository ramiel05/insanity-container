import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";
import type { SuccessStatusCode } from "hono/utils/http-status";
import type { AppType } from "@proj/server";

export const api = hc<AppType>("http://localhost:3000");

type SuccessResponseOf<R> = R extends ClientResponse<infer T, infer S, infer F> ? (S extends SuccessStatusCode ? ClientResponse<T, S, F> : never) : never;

type Unwrapped<R> = SuccessResponseOf<R> extends ClientResponse<infer T, infer _S, infer _F> ? T : never;

export async function unwrap<R extends ClientResponse<unknown>>(response: R): Promise<Unwrapped<R>> {
  if (!response.ok) throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
  if (response.status === 204) return undefined as Unwrapped<R>;
  return (response as SuccessResponseOf<R>).json() as Promise<Unwrapped<R>>;
}

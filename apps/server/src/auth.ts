import { verifyToken } from "@clerk/backend";

export interface AuthUser {
  readonly userId: string;
}

export type Authenticator = (request: Request) => Promise<AuthUser | null>;

export const allowAll: Authenticator = () => Promise.resolve({ userId: "test" });

export const rejectAll: Authenticator = () => Promise.resolve(null);

export function createClerkAuthenticator(secretKey: string): Authenticator {
  return async (request) => {
    const header = request.headers.get("Authorization");
    if (header === null || !header.startsWith("Bearer ")) return null;
    const token = header.slice("Bearer ".length);
    if (token.length === 0) return null;
    try {
      const payload = await verifyToken(token, { secretKey });
      const userId = payload.sub ?? "";
      if (userId.length === 0) return null;
      return { userId };
    } catch {
      return null;
    }
  };
}

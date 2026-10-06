import { findUnrecoverableDbError } from "./unrecoverable";

const RETRIED_CLIENT_METHODS = new Set(["execute", "batch", "migrate", "transaction"]);

interface Reconnectable {
  readonly reconnect: () => void | Promise<void>;
}

export function createRecoveringClient<T extends Reconnectable>(client: T): T {
  let recovery: Promise<void> | null = null;
  const recover = (): Promise<void> => {
    recovery ??= Promise.resolve(client.reconnect()).finally(() => {
      recovery = null;
    });
    return recovery;
  };
  const bound = new Map<PropertyKey, unknown>();
  return new Proxy(client, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (bound.has(property)) return bound.get(property);
      const name = String(property);
      if (!RETRIED_CLIENT_METHODS.has(name)) {
        const boundMethod = value.bind(target);
        bound.set(property, boundMethod);
        return boundMethod;
      }
      const recoveringMethod = async (...args: readonly unknown[]): Promise<unknown> => {
        try {
          return await Reflect.apply(value, target, args);
        } catch (error) {
          if (findUnrecoverableDbError(error) === null) {
            throw error;
          }
          console.error("lost the embedded replica's remote stream; reconnecting and retrying once");
          console.error(error);
          await recover();
          return await Reflect.apply(value, target, args);
        }
      };
      bound.set(property, recoveringMethod);
      return recoveringMethod;
    },
  });
}

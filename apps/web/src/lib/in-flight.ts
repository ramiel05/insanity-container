export type InFlightKey = string;

export interface InFlightLock {
  readonly tryRun: <T>(key: InFlightKey, run: () => Promise<T>) => Promise<T> | null;
  readonly isInFlight: (key: InFlightKey) => boolean;
}

export function createInFlightLock(): InFlightLock {
  const inFlight = new Set<InFlightKey>();
  return {
    tryRun: (key, run) => {
      if (inFlight.has(key)) return null;
      inFlight.add(key);
      return run().finally(() => {
        inFlight.delete(key);
      });
    },
    isInFlight: (key) => inFlight.has(key),
  };
}

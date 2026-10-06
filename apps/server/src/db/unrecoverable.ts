const UNRECOVERABLE_DB_ERROR_SIGNATURE = "stream not found";

export function findUnrecoverableDbError(error: unknown): Error | null {
  let current: unknown = error;
  while (current instanceof Error) {
    if (current.message.includes(UNRECOVERABLE_DB_ERROR_SIGNATURE)) {
      return current;
    }
    current = current.cause;
  }
  return null;
}

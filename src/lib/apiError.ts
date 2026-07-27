export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const maybeData = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  const maybeMessage = maybeData?.message;

  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage;
  }

  const directMessage = (error as { message?: unknown })?.message;
  if (typeof directMessage === 'string' && directMessage.trim()) {
    return directMessage;
  }

  return fallback;
}

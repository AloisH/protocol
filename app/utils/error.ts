/**
 * Extract user-friendly error message from API errors
 */
export function getErrorMessage(
  e: unknown,
  defaultMessage = 'An error occurred. Please try again.',
): string {
  // Network error
  if (e instanceof TypeError && e.message.includes('fetch')) {
    return 'Network error. Check your connection.';
  }

  if (!e || typeof e !== 'object') {
    return defaultMessage;
  }

  // API error with status ($fetch pattern)
  if ('status' in e && typeof e.status === 'number') {
    const status = e.status;

    if (status === 429) {
      return 'Too many attempts. Try again later.';
    }
    if (status === 400) {
      const dataMsg = 'data' in e && e.data && typeof e.data === 'object' && 'message' in e.data
        ? String(e.data.message)
        : null;
      return dataMsg || 'Invalid request.';
    }
    if (status === 401) {
      return 'Invalid credentials.';
    }
    if (status === 403) {
      return 'Access denied.';
    }
    if (status === 404) {
      return 'Not found.';
    }
    if (status >= 500) {
      return 'Server error. Try again later.';
    }
  }

  // Check for message in error data ($fetch pattern)
  if ('data' in e && e.data && typeof e.data === 'object' && 'message' in e.data) {
    return String(e.data.message);
  }

  // Check for direct message property (Better Auth client pattern)
  if ('message' in e && typeof e.message === 'string') {
    return e.message;
  }

  return defaultMessage;
}

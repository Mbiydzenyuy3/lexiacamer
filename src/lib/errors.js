/**
 * Turn a server error into something a person can act on.
 *
 * Two kinds arrive here. Ones we raise ourselves in SQL are already written
 * for a human and say what to do, so they pass through unchanged. Everything
 * else is a Postgres or network condition whose default text explains the
 * mechanism rather than the remedy: "duplicate key value violates unique
 * constraint" tells a director nothing about what to type instead.
 */

const BY_CODE = {
  // We raised it deliberately and wrote it for a person. Use it as-is.
  P0001: (e) => e.message,
  22023: (e) => e.message,

  23505: () =>
    'That already exists. Give it a different name.',
  23503: () =>
    'Something it refers to no longer exists. Refresh the page and try again.',
  23514: () =>
    'That value is not allowed. Check it and try again.',
  42501: () =>
    'You do not have permission to do that. Only a director can.',
  42883: () =>
    'This feature is not set up on the server yet.',
  PGRST202: () =>
    'This feature is not set up on the server yet.',
};

export function describeError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return '';

  // The friendly text is for the person; the original is for whoever has to
  // fix it. A "function not found" names the exact signature PostgREST looked
  // for, which is the difference between diagnosing it in a minute and
  // guessing for an hour.
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('[lexia] server error:', {
      code: error.code, message: error.message,
      details: error.details, hint: error.hint,
    });
  }

  // Offline, DNS, a dropped connection: nothing the server said.
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  const byCode = BY_CODE[error.code];
  if (byCode) return byCode(error);

  // Some Supabase errors carry the code only inside the text.
  if (/duplicate key value/i.test(error.message || '')) {
    return 'That already exists. Give it a different name.';
  }
  if (/could not find the function/i.test(error.message || '')) {
    return 'This feature is not set up on the server yet.';
  }

  return error.message || fallback;
}

import sql from '../db';

export type KeyStatus = 'active' | 'exhausted' | 'disabled' | 'error';

export interface GeminiKey {
  id: string;
  alias: string;
  key_value: string;
  status: KeyStatus;
  usage_today: number;
  daily_limit: number;
  total_calls: number;
  last_used: string | null;
  last_error: string | null;
  error_count: number;
}

// ─── Max consecutive errors before auto-disable ──────────────────────────────
const MAX_ERROR_COUNT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// getKey()
// Returns the best available API key using least-used-first strategy.
// Throws if no active key is available.
// ─────────────────────────────────────────────────────────────────────────────
export async function getKey(): Promise<GeminiKey> {
  const rows = await sql`
    SELECT id, alias, key_value, status, usage_today, daily_limit, total_calls,
           last_used, last_error, error_count
    FROM gemini_api_keys
    WHERE status = 'active'
      AND usage_today < daily_limit
    ORDER BY usage_today ASC
    LIMIT 1
  `;
  const key = rows[0] as GeminiKey | undefined;
  if (!key) {
    throw new Error('SERVICE_UNAVAILABLE: All Gemini API keys are exhausted or disabled. Try again tomorrow.');
  }

  return key;
}

// ─────────────────────────────────────────────────────────────────────────────
// recordSuccess(keyId)
// Increments usage counters after a successful API call.
// ─────────────────────────────────────────────────────────────────────────────
export async function recordSuccess(keyId: string): Promise<void> {
  await sql`
    UPDATE gemini_api_keys
    SET usage_today = usage_today + 1,
        total_calls = total_calls + 1,
        last_used   = NOW(),
        error_count = 0,
        updated_at  = NOW()
    WHERE id = ${keyId}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// recordError(keyId, errorMessage, isQuotaError)
// Handles errors: marks exhausted on 429, increments error count,
// auto-disables after MAX_ERROR_COUNT consecutive errors.
// ─────────────────────────────────────────────────────────────────────────────
export async function recordError(
  keyId: string,
  errorMessage: string,
  isQuotaError = false,
): Promise<void> {
  if (isQuotaError) {
    // Quota exceeded — mark exhausted, will be reset at midnight by cron
    await sql`
      UPDATE gemini_api_keys
      SET status     = 'exhausted',
          last_error = ${errorMessage},
          error_count = error_count + 1,
          updated_at  = NOW()
      WHERE id = ${keyId}
    `;
    return;
  }

  const rows = await sql`SELECT error_count FROM gemini_api_keys WHERE id = ${keyId}`;
  const key = rows[0] as { error_count: number } | undefined;

  const newCount = (key?.error_count ?? 0) + 1;
  const newStatus: KeyStatus = newCount >= MAX_ERROR_COUNT ? 'disabled' : 'error';

  await sql`
    UPDATE gemini_api_keys
    SET status      = ${newStatus === 'disabled' ? 'disabled' : 'active'},
        last_error  = ${errorMessage},
        error_count = ${newCount},
        updated_at  = NOW()
    WHERE id = ${keyId}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// withKeyRotation(fn)
// Wraps a Gemini API call with automatic key rotation and retry logic.
// If a key fails with quota/auth error → auto-retry with the next key.
// ─────────────────────────────────────────────────────────────────────────────
export async function withKeyRotation<T>(
  fn: (apiKey: string) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let key: GeminiKey;

    try {
      key = await getKey();
    } catch {
      throw new Error(
        'SERVICE_UNAVAILABLE: Semua Gemini API key telah habis kuotanya. Coba lagi besok.',
      );
    }

    try {
      const result = await fn(key.key_value);
      await recordSuccess(key.id);
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.toLowerCase().includes('rate limit');
      const isAuth = errMsg.includes('403') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('PERMISSION_DENIED');

      await recordError(key.id, errMsg, isQuota || isAuth);
      lastError = err instanceof Error ? err : new Error(errMsg);

      // If not a quota/auth issue (e.g. transient network), don't rotate
      if (!isQuota && !isAuth) {
        throw lastError;
      }

      // Otherwise loop → next iteration will pick the next best key
    }
  }

  throw lastError ?? new Error('AI service failed after maximum retries');
}

// ─────────────────────────────────────────────────────────────────────────────
// resetDailyUsage()
// Called by Vercel Cron at midnight — resets all exhausted keys for new day.
// ─────────────────────────────────────────────────────────────────────────────
export async function resetDailyUsage(): Promise<{ reset: number }> {
  const result = await sql`
    UPDATE gemini_api_keys
    SET usage_today = 0,
        status      = 'active',
        updated_at  = NOW()
    WHERE status IN ('exhausted', 'active')
    RETURNING id
  `;

  return { reset: result.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllKeyStats()
// Returns all keys with masked values for admin dashboard.
// ─────────────────────────────────────────────────────────────────────────────
export async function getAllKeyStats(): Promise<(Omit<GeminiKey, 'key_value'> & { key_preview: string })[]> {
  const keys = await sql`
    SELECT id, alias, key_value, status, usage_today, daily_limit, total_calls,
           last_used, last_error, error_count
    FROM gemini_api_keys
    ORDER BY status ASC, usage_today ASC
  `;

  return (keys as GeminiKey[]).map(({ key_value, ...rest }) => ({
    ...rest,
    key_preview: `${key_value.slice(0, 8)}...${key_value.slice(-4)}`,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// addKey(alias, keyValue, dailyLimit)
// ─────────────────────────────────────────────────────────────────────────────
export async function addKey(alias: string, keyValue: string, dailyLimit = 1500) {
  const rows = await sql`
    INSERT INTO gemini_api_keys (alias, key_value, daily_limit)
    VALUES (${alias}, ${keyValue}, ${dailyLimit})
    RETURNING id, alias, status, daily_limit, created_at
  `;
  return rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// removeKey(id)
// ─────────────────────────────────────────────────────────────────────────────
export async function removeKey(id: string) {
  await sql`DELETE FROM gemini_api_keys WHERE id = ${id}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// toggleKey(id)
// Enable or disable a key manually.
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleKey(id: string): Promise<{ status: KeyStatus }> {
  const rows = await sql`SELECT status FROM gemini_api_keys WHERE id = ${id} LIMIT 1`;
  const key = rows[0] as { status: KeyStatus } | undefined;
  if (!key) throw new Error('Key not found');

  const newStatus: KeyStatus = key.status === 'disabled' ? 'active' : 'disabled';
  await sql`
    UPDATE gemini_api_keys SET status = ${newStatus}, error_count = 0, updated_at = NOW()
    WHERE id = ${id}
  `;
  return { status: newStatus };
}

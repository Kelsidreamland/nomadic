import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
}

export function useRetry<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2 } = options;
  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    retryCount: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setState((prev) => ({ ...prev, isLoading: true, error: null, retryCount: 0 }));

      let lastError: Error | null = null;
      let currentDelay = delayMs;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFn(...args);
          setState({
            data: result,
            error: null,
            isLoading: false,
            retryCount: attempt,
          });
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // Don't retry if explicitly aborted
          if (abortRef.current?.signal.aborted) {
            throw lastError;
          }

          // Don't retry on auth errors (401/403)
          const axiosErr = err as any;
          if (axiosErr?.response?.status === 401 || axiosErr?.response?.status === 403) {
            break;
          }

          if (attempt < maxRetries) {
            setState((prev) => ({ ...prev, retryCount: attempt + 1 }));
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            currentDelay *= backoffMultiplier;
          }
        }
      }

      setState({
        data: null,
        error: lastError,
        isLoading: false,
        retryCount: maxRetries,
      });
      throw lastError;
    },
    [asyncFn, maxRetries, delayMs, backoffMultiplier]
  );

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setState({ data: null, error: null, isLoading: false, retryCount: 0 });
  }, []);

  return { ...state, execute, reset };
}

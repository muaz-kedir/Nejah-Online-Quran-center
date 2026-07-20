import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { api, apiUrl } from "@/lib/api";

type ApiQueryOptions<T> = {
  queryKey: unknown[];
  path: string;
  fetchOptions?: RequestInit & { timeout?: number };
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  gcTime?: number;
  select?: (data: T) => unknown;
} & Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled" | "select">;

export function useApiQuery<T = any>({
  queryKey,
  path,
  fetchOptions,
  enabled = true,
  refetchInterval,
  staleTime,
  gcTime,
  select,
  ...rest
}: ApiQueryOptions<T>): UseQueryResult<T> {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(path), {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...fetchOptions?.headers,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.message
            ? Array.isArray(body.message)
              ? body.message.join(", ")
              : body.message
            : `Request failed: ${res.status}`;
        throw new Error(msg);
      }
      return res.json();
    },
    enabled,
    refetchInterval,
    staleTime,
    gcTime,
    select,
    ...rest,
  });
}

import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await res.json();
        const errorMessage = errorJson.error || errorJson.message || 'Unknown error';
        const error = new Error(`${res.status}: ${errorMessage}`);
        (error as any).response = res;
        (error as any).data = errorJson;
        throw error;
      } else {
        const text = (await res.text()) || res.statusText;
        const error = new Error(`${res.status}: ${text}`);
        (error as any).response = res;
        throw error;
      }
    } catch (e) {
      if (e instanceof Error && (e as any).response) {
        throw e;
      }
      const error = new Error(`${res.status}: ${res.statusText}`);
      (error as any).response = res;
      throw error;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const fullUrl = url.startsWith("/api")
    ? `${API_URL}${url}`
    : url;

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
    async ({ queryKey }) => {
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith("/api")
        ? `${API_URL}${url}`
        : url;

      try {
        const res = await fetch(fullUrl, {
          credentials: "include",
        });

        if (on401 === "returnNull" && res.status === 401) {
          return null as any;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        if (on401 === "returnNull" && error instanceof Error && error.message.includes("401")) {
          return null as any;
        }
        throw error;
      }
    };

export const clearUserDataFromCache = () => {
  queryClient.clear();

  try {
    Object.keys(localStorage).forEach(key => {
      if (
        key.includes("form") ||
        key.includes("user") ||
        key.includes("diary") ||
        key.includes("training") ||
        key.includes("state") ||
        key.includes("cache")
      ) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach(key => {
      if (
        key.includes("form") ||
        key.includes("user") ||
        key.includes("diary") ||
        key.includes("training") ||
        key.includes("state")
      ) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Error clearing storage:", e);
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

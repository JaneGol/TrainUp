import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await res.json();
        const errorMessage = errorJson.error || errorJson.message || 'Unknown error';
        const error = new Error(`${res.status}: ${errorMessage}`);
        (error as any).response = res;
        (error as any).data = errorJson;
        throw error;
      } else {
        // Fall back to text
        const text = (await res.text()) || res.statusText;
        const error = new Error(`${res.status}: ${text}`);
        (error as any).response = res;
        throw error;
      }
    } catch (e) {
      if (e instanceof Error) {
        // If we already created a custom error, just throw it
        if ((e as any).response) {
          throw e;
        }
      }
      // Otherwise create a generic error
      const error = new Error(`${res.status}: ${res.statusText}`);
      (error as any).response = res;
      throw error;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
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
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  };

export const clearUserDataFromCache = () => {
  // Clear all query cache
  queryClient.clear();
  
  // Clear any localStorage items that might contain user data
  try {
    Object.keys(localStorage).forEach(key => {
      // Clear form data, cache, and any user-specific data
      if (
        key.includes('form') || 
        key.includes('user') || 
        key.includes('diary') || 
        key.includes('training') || 
        key.includes('state') ||
        key.includes('cache')
      ) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear sessionStorage items that might contain user data
    Object.keys(sessionStorage).forEach(key => {
      if (
        key.includes('form') || 
        key.includes('user') || 
        key.includes('diary') || 
        key.includes('training') || 
        key.includes('state')
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

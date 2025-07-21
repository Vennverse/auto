import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
  planType?: string;
  userType?: string;
  emailVerified?: boolean;
}

export function useAuth() {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
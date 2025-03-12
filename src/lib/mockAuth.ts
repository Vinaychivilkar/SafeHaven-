// This file provides mock authentication functionality when Supabase is not configured

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

export const createMockUser = (email: string): MockUser => {
  const mockUser = {
    id: `mock-${Math.random().toString(36).substring(2, 15)}`,
    email,
    created_at: new Date().toISOString(),
  };

  // Store in localStorage to persist across page refreshes
  localStorage.setItem("mockUser", JSON.stringify(mockUser));

  return mockUser;
};

export const getMockUser = (): MockUser | null => {
  const mockUser = localStorage.getItem("mockUser");
  if (mockUser) {
    try {
      return JSON.parse(mockUser);
    } catch (e) {
      console.error("Error parsing mock user", e);
      return null;
    }
  }
  return null;
};

export const removeMockUser = (): void => {
  localStorage.removeItem("mockUser");
};

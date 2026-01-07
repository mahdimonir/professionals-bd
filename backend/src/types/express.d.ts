export { };

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      accessToken?: string;
      refreshToken?: string;
      user?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        avatar: string | null;
      };
    }
  }
}


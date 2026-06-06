export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  avatarColor: string;
  createdAt?: string;
}

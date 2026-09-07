
import { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PHARMACIST"
  | "BILLING_STAFF"
  | "RECEPTIONIST";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
  }
}
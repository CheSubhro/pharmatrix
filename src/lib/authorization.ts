
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  hasPermission,
  Permission,
  UserRole,
} from "@/constants/permissions";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      status: 401 as const,
      user: null,
    };
  }

  return {
    authorized: true,
    status: 200 as const,
    user,
  };
}

export async function requirePermission(
  permission: Permission
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      status: 401 as const,
      user: null,
    };
  }

  const role = user.role as UserRole;

  if (!hasPermission(role, permission)) {
    return {
      authorized: false,
      status: 403 as const,
      user: null,
    };
  }

  return {
    authorized: true,
    status: 200 as const,
    user,
  };
}
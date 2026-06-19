"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { APIResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function updateUserRole(
  userId: string,
  newRole: string,
): Promise<APIResponse> {
  const session = await requireAdmin();

  try {
    // Prevent admin from changing their own role (optional)
    if (session.user.id === userId) {
      return {
        status: "error",
        message: "You cannot change your own role",
      };
    }

    // Validate role
    const validRoles = ["user", "instructor", "admin"];
    if (!validRoles.includes(newRole)) {
      return {
        status: "error",
        message: "Invalid role",
      };
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/admin/users");

    return {
      status: "success",
      message: `User role updated to ${newRole}`,
    };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return {
      status: "error",
      message: "Failed to update user role",
    };
  }
}

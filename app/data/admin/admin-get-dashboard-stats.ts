import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetDashboardStats() {
  await requireAdmin();

  const [
    totalSignups,
    totalCustomers,
    totalCourses,
    totalLessons,
    revenueResult,
  ] = await Promise.all([
    // total signups
    prisma.user.count(),

    // total customers (users with at least one enrollment)
    prisma.user.count({
      where: {
        enrollment: {
          some: {},
        },
      },
    }),

    // total courses
    prisma.course.count(),

    // total lessons
    prisma.lesson.count(),

    // total revenue from ACTIVE enrollments
    prisma.enrollment.aggregate({
      where: {
        status: "Active",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const totalRevenue = revenueResult._sum.amount ?? 0;

  return {
    totalSignups,
    totalCustomers,
    totalCourses,
    totalLessons,
    totalRevenue,
  };
}

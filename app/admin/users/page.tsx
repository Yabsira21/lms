import { Suspense } from "react";
import { adminGetUsers } from "@/app/data/admin/admin-get-users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "./_components/UsersTable";
import { UsersTableSkeleton } from "./_components/UsersTableSkeleton";
// import { UsersTableSkeleton } from "./_components/UsersTableSkeleton";

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles, view enrolled courses, and handle user accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all registered users with their roles and enrollment
            status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTableContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function UsersTableContent() {
  const users = await adminGetUsers();
  return <UsersTable users={users} />;
}

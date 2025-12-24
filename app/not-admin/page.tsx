import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export default function NotAdminRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4 py-10">
          <div className="bg-destructive/10 rounded-full p-4 w-fit mx-auto">
            <ShieldX className="size-16 text-destructive" />
          </div>

          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="max-w-xs mx-auto">
            You do not have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants({ className: "w-full" })}>
            <ArrowLeft className="size-4 mr-1" />
            Back to Home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

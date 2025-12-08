"use client";

import { GoogleIcon } from "@/components/custom/google-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { GithubIcon, Loader, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [githubPending, startGithubTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [email, setEmail] = useState("");

  async function signinWithGitHub() {
    // await authClient.sign("github");
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            console.log("Successfully signed in with GitHub");
            toast.success("Successfully signed in with GitHub");
          },
          onError: (error) => {
            console.log(error);
            toast.error("Internal Server Error", { position: "top-center" });
          },
        },
      });
    });
  }

  async function signinWithGoogle() {
    // await authClient.sign("github");
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            console.log("Successfully signed in with GitHub");
            toast.success("Successfully signed in with GitHub");
          },
          onError: (error) => {
            console.log(error);
            toast.error("Internal Server Error", { position: "top-center" });
          },
        },
      });
    });
  }

  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification email sent", {
              position: "top-center",
            });
            router.push(`/verify-request?email=${email}`);
          },
          onError: (error) => {
            console.log(error);
            toast.error("Internal Server Error", { position: "top-center" });
          },
        },
      });
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome Back!</CardTitle>
        <CardDescription>Login with your Github</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Button
          disabled={githubPending}
          onClick={signinWithGitHub}
          className="w-full"
          variant="outline"
        >
          {githubPending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <GithubIcon className="size-4" />
              Sign in with Github
            </>
          )}
        </Button>

        <Button
          disabled={googlePending}
          onClick={signinWithGoogle}
          className="w-full"
          variant="outline"
        >
          {googlePending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              {/* <GithubIcon className="size-4" /> */}
              <GoogleIcon />
              Sign in with Google
            </>
          )}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>

          <Button onClick={signInWithEmail} disabled={emailPending}>
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Continue with Email</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignUpInput) {
    setIsPending(true);

    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    setIsPending(false);

    if (error) {
      toast.error(error.message ?? "Could not create your account.");
      return;
    }

    toast.success("Account created.");
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details below to create your RepoAsk account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="signup-form-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="signup-form-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-form-password">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="signup-form-password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button
          type="submit"
          form="signup-form"
          disabled={isPending}
          className="w-full"
        >
          {isPending && <Spinner />}
          {isPending ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

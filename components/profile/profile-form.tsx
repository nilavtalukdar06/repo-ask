"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { profileSchema } from "@/app/api/profile/schema";
import { authClient } from "@/lib/auth-client";
import { useProfileQuery, useSaveProfileMutation } from "@/lib/queries/profile";

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
import { AvatarUpload } from "@/components/profile/avatar-upload";

const nameAndGithubUrlSchema = z.object({
  name: profileSchema.shape.name,
  githubUrl: profileSchema.shape.githubUrl,
});

type ProfileFormValues = z.infer<typeof nameAndGithubUrlSchema>;

export function ProfileForm() {
  const { data: session } = authClient.useSession();
  const { data: profile, isLoading } = useProfileQuery();
  const saveMutation = useSaveProfileMutation();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(nameAndGithubUrlSchema),
    defaultValues: { name: "", githubUrl: "" },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name, githubUrl: profile.githubUrl });
    } else if (session?.user.name) {
      form.reset({ name: session.user.name, githubUrl: "" });
    }
  }, [profile, session?.user.name, form]);

  function onSubmit(values: ProfileFormValues) {
    saveMutation.mutate(
      { ...values, hasProfile: Boolean(profile) },
      {
        onSuccess: () => toast.success("Profile saved."),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your name and GitHub profile shown across RepoAsk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <AvatarUpload />
        </div>
        <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-form-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="profile-form-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ada Lovelace"
                    disabled={isLoading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="githubUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-form-github-url">
                    GitHub URL
                  </FieldLabel>
                  <Input
                    {...field}
                    id="profile-form-github-url"
                    type="url"
                    aria-invalid={fieldState.invalid}
                    placeholder="https://github.com/username"
                    disabled={isLoading}
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
      <CardFooter>
        <Button
          type="submit"
          form="profile-form"
          disabled={saveMutation.isPending || isLoading}
        >
          {saveMutation.isPending && <Spinner />}
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  addRepositorySchema,
  type AddRepositoryInput,
} from "@/app/api/repository/schema";
import { useCreateRepositoryMutation } from "@/lib/queries/repository";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type AddRepositoryDialogProps = {
  renderTrigger: React.ReactElement;
  children: React.ReactNode;
};

export function AddRepositoryDialog({
  renderTrigger,
  children,
}: AddRepositoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const mutation = useCreateRepositoryMutation();

  const form = useForm<AddRepositoryInput>({
    resolver: zodResolver(addRepositorySchema),
    defaultValues: { githubUrl: "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset();
    }
  }

  function onSubmit(values: AddRepositoryInput) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Repository added. Indexing has started.");
        handleOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={renderTrigger}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add repository</DialogTitle>
          <DialogDescription>
            Add a public GitHub repository to start indexing it and asking
            questions about its code.
          </DialogDescription>
        </DialogHeader>
        <form id="add-repository-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="githubUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="add-repository-github-url">
                    GitHub URL
                  </FieldLabel>
                  <Input
                    {...field}
                    id="add-repository-github-url"
                    type="url"
                    aria-invalid={fieldState.invalid}
                    placeholder="https://github.com/owner/repo"
                    autoComplete="off"
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button
            type="submit"
            form="add-repository-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner />}
            {mutation.isPending ? "Adding..." : "Add repository"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateApiKeyMutation,
  useProfileQuery,
  useRemoveApiKeyMutation,
} from "@/lib/queries/profile";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ApiKeySection() {
  const { data: profile, isLoading } = useProfileQuery();
  const [apiKey, setApiKey] = React.useState("");
  const createMutation = useCreateApiKeyMutation();
  const removeMutation = useRemoveApiKeyMutation();

  const hasKey = Boolean(profile?.apiKeyPrefix);

  function handleSave() {
    const trimmed = apiKey.trim();

    if (!trimmed) {
      toast.error("Enter an API key.");
      return;
    }

    createMutation.mutate(trimmed, {
      onSuccess: () => {
        toast.success("API key saved.");
        setApiKey("");
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function handleRemove() {
    removeMutation.mutate(undefined, {
      onSuccess: () => toast.success("API key removed."),
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI API key</CardTitle>
        <CardDescription>
          RepoAsk uses your own key to call the OpenAI API. Stored encrypted,
          never shared or logged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner />
        ) : hasKey ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <KeyRoundIcon className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Personal · OpenAI</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {profile?.apiKeyPrefix}••••••••••••
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending && <Spinner />}
              Remove
            </Button>
          </div>
        ) : (
          <Field>
            <FieldLabel htmlFor="openai-api-key">API key</FieldLabel>
            <Input
              id="openai-api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
            />
            <FieldDescription>
              Paste your OpenAI secret key. We only store an encrypted copy and
              a short prefix.
            </FieldDescription>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="mt-2 w-fit"
            >
              {createMutation.isPending && <Spinner />}
              Save key
            </Button>
          </Field>
        )}
      </CardContent>
    </Card>
  );
}

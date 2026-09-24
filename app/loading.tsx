import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Loading</EmptyTitle>
          <EmptyDescription>
            Just a moment while we get things ready.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTagMutations } from "@/features/tags/hooks/use-tags";
import type { GetTagDto } from "@/features/tags/types";

type TagDeleteButtonProps = {
  tag: GetTagDto;
  onDeleted?: () => void;
};

export function TagDeleteButton({ tag, onDeleted }: TagDeleteButtonProps) {
  const { deleteMutation } = useTagMutations();
  const { mutate, isPending } = deleteMutation;

  function handleDelete() {
    mutate(tag.id, { onSuccess: () => onDeleted?.() });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Delete ${tag.name}`}
            title="Delete tag"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete tag?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{tag.name}&rdquo;.{" "}
            {tag.postCount > 0
              ? `It is currently used by ${tag.postCount} ${
                  tag.postCount === 1 ? "post" : "posts"
                } and will be removed from them.`
              : "It is not assigned to any posts."}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

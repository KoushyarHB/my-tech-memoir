"use client";

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
import { Trash2 } from "lucide-react";
import { useDeletePost } from "@/features/blog/hooks/use-post-mutations";

type PostDeleteButtonProps = {
  postId: string;
  postTitle: string;
};

export function PostDeleteButton({ postId, postTitle }: PostDeleteButtonProps) {
  // `useDeletePost` invalidates the posts cache, so the table and the metric
  // tiles recompute without a full server re-render.
  const { mutate: deletePost, isPending } = useDeletePost();

  function handleDelete() {
    deletePost(postId);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={isPending}>
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete post?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{postTitle}&rdquo;. This action
            cannot be undone.
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

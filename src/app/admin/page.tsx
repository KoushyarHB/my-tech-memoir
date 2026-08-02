import Link from "next/link";
import { getAllPosts } from "@/features/blog/server/post-service";
import { db } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, CheckCircle, Clock, Tag, Eye, Pencil } from "lucide-react";
import { PostDeleteButton } from "./post-delete-button";
import { cn } from "@/lib/utils";

export default async function AdminDashboard() {
  const posts = await getAllPosts();
  const tagCount = await db.tag.count();

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-primary">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your posts and content
          </p>
        </div>
        <Link className={cn(buttonVariants({ variant: "default" }))} href="/admin/new">
            <Plus className="size-4" />
            New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <FileText className="size-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Total posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <CheckCircle className="size-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <Clock className="size-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <Tag className="size-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{tagCount}</p>
              <p className="text-xs text-muted-foreground">Tags</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-2 text-muted-foreground">No posts yet</p>
              <Link href="/admin/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <Plus className="size-4" />
                Create your first post
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[90px]">Views</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link
                        href={`/admin/${post.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {post.title}
                      </Link>
                      {post.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "outline"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(post.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {post.viewCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-sm" })
                            )}
                            title="View published post"
                            aria-label="View published post"
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/${post.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon-sm" })
                          )}
                          title="Edit post"
                          aria-label="Edit post"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <PostDeleteButton postId={post.id} postTitle={post.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

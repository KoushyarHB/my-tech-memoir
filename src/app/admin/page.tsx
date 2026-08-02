import Link from "next/link";
import { getAllPosts } from "@/features/blog/server/post-service";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, FileText, CheckCircle, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPostsTable } from "@/features/admin/components";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const posts = await getAllPosts();
  const tagCount = await db.tag.count();

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  const tablePosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    viewCount: post.viewCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime: post.readingTime,
    tags: post.tags,
  }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
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
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-2 text-muted-foreground">No posts yet</p>
              <Link
                href="/admin/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Plus className="size-4" />
                Create your first post
              </Link>
            </div>
          ) : (
            <AdminPostsTable posts={tablePosts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

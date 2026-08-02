import { db } from "@/lib/db";
import { slugify } from "@/features/blog/lib/slugify";

export type AdminTag = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  postCount: number;
};

export async function listTags(): Promise<AdminTag[]> {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { posts: true } },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    postCount: tag._count.posts,
  }));
}

export async function createTag(input: {
  name: string;
  slug?: string;
}): Promise<AdminTag> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Tag name is required");
  }
  if (name.length > 60) {
    throw new Error("Tag name must be 60 characters or fewer");
  }

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) {
    throw new Error("Tag slug could not be generated from the name");
  }

  const existing = await db.tag.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
    },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    if (existing.slug === slug) {
      throw new Error("A tag with this slug already exists");
    }
    throw new Error("A tag with this name already exists");
  }

  try {
    const tag = await db.tag.create({
      data: { name, slug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true } },
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      postCount: tag._count.posts,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error("A tag with this name or slug already exists");
    }
    throw error;
  }
}

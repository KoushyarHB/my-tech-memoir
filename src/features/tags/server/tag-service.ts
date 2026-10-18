import { slugify } from "@/shared/lib/slugify";
import { TAG_NAME_MAX_LENGTH } from "../constants/tag";
import type { CreateTagRequest, GetTagDto } from "../types";
import {
  findTagByNameInsensitive,
  findTagBySlugExact,
  insertTag,
} from "./tag-repository";

/**
 * Tags domain: business rules.
 *
 * Sits between the route handler and the repository, the way tms-backend's
 * command handlers sit between controllers and repositories. It owns
 * validation and uniqueness; the repository owns SQL.
 */

export class TagValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TagValidationError";
    this.status = status;
  }
}

export async function createTag(input: CreateTagRequest): Promise<GetTagDto> {
  const name = (input.name ?? "").trim();
  if (!name) {
    throw new TagValidationError("Tag name is required");
  }
  if (name.length > TAG_NAME_MAX_LENGTH) {
    throw new TagValidationError(
      `Tag name must be ${TAG_NAME_MAX_LENGTH} characters or fewer`
    );
  }

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) {
    throw new TagValidationError(
      "Tag slug could not be generated from the name"
    );
  }

  const [sameName, sameSlug] = await Promise.all([
    findTagByNameInsensitive(name),
    findTagBySlugExact(slug),
  ]);

  if (sameSlug || sameName) {
    throw new TagValidationError(
      sameSlug
        ? "A tag with this slug already exists"
        : "A tag with this name already exists",
      409
    );
  }

  try {
    return await insertTag({ name, slug });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new TagValidationError(
        "A tag with this name or slug already exists",
        409
      );
    }
    throw error;
  }
}

import { documentToPlainText, type TiptapDocument } from "../types/document";

const WORDS_PER_MINUTE = 238;

export function estimateReadingTime(content: string): string {
  const text = content.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export function estimateDocumentReadingTime(document: TiptapDocument): string {
  return estimateReadingTime(documentToPlainText(document));
}

export function readingTimeMinutes(content: string): number {
  const text = content.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

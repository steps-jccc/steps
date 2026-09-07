import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CommentNode, CommentRow } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildCommentTree(rows: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of rows) {
    map.set(row.id, {
      ...row,
      heart_count: Number(row.heart_count),
      prayer_count: Number(row.prayer_count),
      thinking_count: Number(row.thinking_count),
      children: [],
    });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  }

  return roots;
}

export function scriptureSnippet(text: string, max = 160) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

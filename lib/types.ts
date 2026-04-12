import type { AppLanguage } from "@/lib/i18n";

export interface NormalizedArticle {
  pageId: number;
  title: string;
  summary: string;
  imageUrl: string | null;
  wikipediaUrl: string;
  readingLockSeconds: number;
  contentLanguage: AppLanguage;
  isMachineTranslated: boolean;
}

export type VoteType = "like" | "dislike";
export type SwipeDirection = "left" | "right";

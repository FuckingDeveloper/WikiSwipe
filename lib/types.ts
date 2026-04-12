export interface NormalizedArticle {
  pageId: number;
  title: string;
  summary: string;
  imageUrl: string | null;
  wikipediaUrl: string;
}

export type VoteType = "like" | "dislike";
export type SwipeDirection = "left" | "right";

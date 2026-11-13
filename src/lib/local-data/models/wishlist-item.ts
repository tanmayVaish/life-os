import type { LocalRecord } from "@/lib/local-data/models/common";

export const wishlistCategories = [
  "Tech",
  "Clothing",
  "Books",
  "Home",
  "Education",
  "Other",
] as const;

export const wishlistPriorities = ["Low", "Medium", "High"] as const;

export type WishlistCategory = (typeof wishlistCategories)[number];
export type WishlistPriority = (typeof wishlistPriorities)[number];
export type WishlistStatus = "wanted" | "purchased";

export type WishlistItemRecord = LocalRecord & {
  name: string;
  description?: string;
  category: WishlistCategory;
  estimatedPrice?: number;
  purchasePrice?: number;
  priority: WishlistPriority;
  productUrl?: string;
  addedDate: string;
  status: WishlistStatus;
  purchasedDate?: string;
};

export type WishlistItemInput = Pick<
  WishlistItemRecord,
  | "name"
  | "description"
  | "category"
  | "estimatedPrice"
  | "priority"
  | "productUrl"
>;

import { getLocalDateKey, isDateKey } from "@/lib/local-date";
import {
  wishlistCategories,
  wishlistPriorities,
  type WishlistCategory,
  type WishlistItemInput,
  type WishlistItemRecord,
  type WishlistPriority,
} from "@/lib/local-data/models/wishlist-item";
import { createLocalRepository } from "@/lib/local-data/repository";
import { requireNonBlank } from "@/lib/local-data/validation";

function isWishlistCategory(value: string): value is WishlistCategory {
  return wishlistCategories.some((category) => category === value);
}

function isWishlistPriority(value: string): value is WishlistPriority {
  return wishlistPriorities.some((priority) => priority === value);
}

function validatePrice(value: number | undefined, label: string) {
  if (
    value !== undefined &&
    (!Number.isFinite(value) || value < 0)
  ) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

function validateWishlistItem(item: WishlistItemRecord) {
  requireNonBlank(item.name, "Wishlist item name");
  if (item.description !== undefined && typeof item.description !== "string") {
    throw new Error("Wishlist description must be text.");
  }
  if (!isWishlistCategory(item.category)) {
    throw new Error("Choose a valid Wishlist category.");
  }
  if (!isWishlistPriority(item.priority)) {
    throw new Error("Choose a valid Wishlist priority.");
  }
  validatePrice(item.estimatedPrice, "Estimated price");
  validatePrice(item.purchasePrice, "Purchase price");
  if (item.productUrl !== undefined) {
    try {
      const url = new URL(item.productUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error();
      }
    } catch {
      throw new Error("Enter a valid product URL beginning with http or https.");
    }
  }
  if (!isDateKey(item.addedDate)) {
    throw new Error("Choose a valid added date.");
  }
  if (item.purchasedDate !== undefined && !isDateKey(item.purchasedDate)) {
    throw new Error("Choose a valid purchased date.");
  }
  if (item.status !== "wanted" && item.status !== "purchased") {
    throw new Error("Choose a valid Wishlist status.");
  }
}

const wishlistRepository = createLocalRepository<WishlistItemRecord>(
  "wishlistItems",
  validateWishlistItem,
);

export function createWishlistItem(
  input: WishlistItemInput,
): Promise<WishlistItemRecord> {
  return wishlistRepository.create({
    ...input,
    status: "wanted",
    addedDate: getLocalDateKey(new Date()),
  });
}

export const getWishlistItem = wishlistRepository.get;
export const listWishlistItems = wishlistRepository.list;
export const updateWishlistItem = wishlistRepository.update;
export const deleteWishlistItem = wishlistRepository.delete;

export function markWishlistItemPurchased(
  id: string,
  purchasedDate: string,
  purchasePrice?: number,
) {
  return wishlistRepository.update(id, {
    status: "purchased",
    purchasedDate,
    purchasePrice,
  });
}

export function restoreWishlistItem(id: string) {
  return wishlistRepository.update(id, {
    status: "wanted",
    purchasedDate: undefined,
    purchasePrice: undefined,
  });
}

export function summarizeWishlist(items: WishlistItemRecord[]) {
  const wanted = items.filter((item) => item.status === "wanted");
  const purchased = items.filter((item) => item.status === "purchased");
  const recordedPurchases = purchased.filter(
    (item) => item.purchasePrice !== undefined,
  );

  return {
    wantedCount: wanted.length,
    estimatedTotal: wanted.reduce(
      (total, item) => total + (item.estimatedPrice ?? 0),
      0,
    ),
    purchasedCount: purchased.length,
    recordedPurchaseCount: recordedPurchases.length,
    purchasedTotal: recordedPurchases.reduce(
      (total, item) => total + (item.purchasePrice ?? 0),
      0,
    ),
  };
}

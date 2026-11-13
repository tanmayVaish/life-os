"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import type {
  WishlistCategory,
  WishlistItemInput,
  WishlistItemRecord,
  WishlistPriority,
} from "@/lib/local-data";
import {
  wishlistCategories,
  wishlistPriorities,
} from "@/lib/local-data";
import { getLocalDateKey } from "@/lib/local-date";
import type { CurrencyPreference } from "@/lib/preferences";

function isWishlistCategory(value: string): value is WishlistCategory {
  return wishlistCategories.some((category) => category === value);
}

function isWishlistPriority(value: string): value is WishlistPriority {
  return wishlistPriorities.some((priority) => priority === value);
}

export function WishlistEditor({
  item,
  currency,
  onSave,
}: {
  item: WishlistItemRecord | null;
  currency: CurrencyPreference;
  onSave: (input: WishlistItemInput) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState<WishlistCategory>(
    item?.category ?? "Other",
  );
  const [priority, setPriority] = useState<WishlistPriority>(
    item?.priority ?? "Medium",
  );
  const [estimatedPrice, setEstimatedPrice] = useState(
    item?.estimatedPrice === undefined ? "" : String(item.estimatedPrice),
  );
  const [productUrl, setProductUrl] = useState(item?.productUrl ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPrice = estimatedPrice.trim();
    const numericPrice = Number(trimmedPrice);

    if (!trimmedName) {
      setError("Add a name for this item.");
      return;
    }
    if (
      trimmedPrice &&
      (!Number.isFinite(numericPrice) || numericPrice < 0)
    ) {
      setError("Estimated price must be a non-negative number.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
        category,
        priority,
        estimatedPrice: trimmedPrice ? numericPrice : undefined,
        productUrl: productUrl.trim() || undefined,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The Wishlist item could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form wishlist-editor" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Item name</span>
        <input
          autoFocus
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      <label className="capture-field">
        <span>
          Description or reason{" "}
          <span className="optional-label">Optional</span>
        </span>
        <textarea
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          value={description}
        />
      </label>

      <div className="wishlist-editor-fields">
        <label className="capture-field">
          <span>Category</span>
          <select
            onChange={(event) => {
              const value = event.target.value;
              if (isWishlistCategory(value)) setCategory(value);
            }}
            value={category}
          >
            {wishlistCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="capture-field">
          <span>Priority</span>
          <select
            onChange={(event) => {
              const value = event.target.value;
              if (isWishlistPriority(value)) setPriority(value);
            }}
            value={priority}
          >
            {wishlistPriorities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="capture-field">
        <span>
          Estimated price ({currency}){" "}
          <span className="optional-label">Optional</span>
        </span>
        <input
          inputMode="decimal"
          min="0"
          onChange={(event) => setEstimatedPrice(event.target.value)}
          placeholder="0.00"
          step="0.01"
          type="number"
          value={estimatedPrice}
        />
      </label>

      <label className="capture-field">
        <span>
          Product URL <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(event) => setProductUrl(event.target.value)}
          placeholder="https://"
          type="url"
          value={productUrl}
        />
      </label>

      {error && <ErrorNotice message={error} />}

      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : item ? "Save changes" : "Add to Wishlist"}
        </button>
      </div>
    </form>
  );
}

export function WishlistPurchaseEditor({
  currency,
  onSave,
}: {
  currency: CurrencyPreference;
  onSave: (date: string, price?: number) => Promise<void>;
}) {
  const dateKey = getLocalDateKey(new Date());
  const [purchasedDate, setPurchasedDate] = useState(dateKey);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrice = purchasePrice.trim();
    const numericPrice = Number(trimmedPrice);
    if (
      trimmedPrice &&
      (!Number.isFinite(numericPrice) || numericPrice < 0)
    ) {
      setError("Purchase price must be a non-negative number.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave(
        purchasedDate,
        trimmedPrice ? numericPrice : undefined,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The purchase could not be recorded.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form wishlist-purchase-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Purchased date</span>
        <input
          onChange={(event) => setPurchasedDate(event.target.value)}
          required
          type="date"
          value={purchasedDate}
        />
      </label>
      <label className="capture-field">
        <span>
          Purchase price ({currency}){" "}
          <span className="optional-label">Optional</span>
        </span>
        <input
          inputMode="decimal"
          min="0"
          onChange={(event) => setPurchasePrice(event.target.value)}
          placeholder="0.00"
          step="0.01"
          type="number"
          value={purchasePrice}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <div className="record-form-footer">
        <span>Purchase records stay separate from Finance.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Record purchase"}
        </button>
      </div>
    </form>
  );
}

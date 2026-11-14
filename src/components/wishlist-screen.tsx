"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import type { CurrencyPreference } from "@/lib/preferences";
import { ModalDialog } from "@/components/modal-dialog";
import { useLocalRecords } from "@/hooks/use-local-records";
import { usePreferences } from "@/hooks/use-preferences";
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  markWishlistItemPurchased,
  restoreWishlistItem,
  summarizeWishlist,
  updateWishlistItem,
  wishlistCategories,
  wishlistPriorities,
  type WishlistCategory,
  type WishlistItemInput,
  type WishlistItemRecord,
  type WishlistPriority,
} from "@/lib/local-data";
import { formatCurrency } from "@/lib/formatters";
import { formatDateKey } from "@/lib/local-date";
import {
  WishlistEditor,
  WishlistPurchaseEditor,
} from "@/components/wishlist-editor";

type WishlistView = "wanted" | "purchased";
type DialogMode = "closed" | "form" | "detail" | "purchase";
type CategoryFilter = WishlistCategory | "all";
type PriorityFilter = WishlistPriority | "all";

function isWishlistCategory(value: string): value is WishlistCategory {
  return wishlistCategories.some((category) => category === value);
}

function isWishlistPriority(value: string): value is WishlistPriority {
  return wishlistPriorities.some((priority) => priority === value);
}

function WishlistRow({
  item,
  currency,
  onOpen,
}: {
  item: WishlistItemRecord;
  currency: CurrencyPreference;
  onOpen: () => void;
}) {
  return (
    <li className="wishlist-row">
      <button
        aria-label={`Open ${item.name} details`}
        className="wishlist-row-summary"
        onClick={onOpen}
        type="button"
      >
        <span className="wishlist-row-heading">
          <span className="wishlist-row-name">{item.name}</span>
          <span className={`wishlist-priority wishlist-priority-${item.priority.toLowerCase()}`}>
            {item.priority}
          </span>
        </span>
        {item.description?.trim() && (
          <span className="wishlist-row-description">{item.description}</span>
        )}
        <span className="wishlist-row-meta">
          <span>{item.category}</span>
          <span>Added {formatDateKey(item.addedDate)}</span>
          {item.status === "purchased" && item.purchasedDate && (
            <span>Purchased {formatDateKey(item.purchasedDate)}</span>
          )}
        </span>
      </button>
      <span className="wishlist-row-price">
        {item.status === "purchased"
          ? item.purchasePrice !== undefined
            ? formatCurrency(item.purchasePrice, currency)
            : "No price recorded"
          : item.estimatedPrice !== undefined
            ? formatCurrency(item.estimatedPrice, currency)
            : "No estimate"}
      </span>
      <span aria-hidden="true" className="wishlist-row-affordance">
        Details
      </span>
    </li>
  );
}

export function WishlistScreen() {
  const { preferences } = usePreferences();
  const wishlist = useLocalRecords("wishlistItems", listWishlistItems);
  const [view, setView] = useState<WishlistView>("wanted");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState("");
  const [editorVersion, setEditorVersion] = useState(0);
  const handledItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    function checkRequestedItem() {
      if (wishlist.isLoading || !wishlist.records.length) return;
      const requestedId = new URLSearchParams(window.location.search).get("itemId");
      if (!requestedId || handledItemIdRef.current === requestedId) return;

      const target = wishlist.records.find((i) => i.id === requestedId);
      if (target) {
        handledItemIdRef.current = requestedId;
        setView(target.status);
        setCategoryFilter("all");
        setPriorityFilter("all");
        setSelectedItemId(target.id);
        setOperationError("");
        setDialogMode("detail");
      }
    }

    checkRequestedItem();
    window.addEventListener("popstate", checkRequestedItem);
    return () => window.removeEventListener("popstate", checkRequestedItem);
  }, [wishlist.isLoading, wishlist.records]);

  const selectedItem =
    wishlist.records.find((item) => item.id === selectedItemId) ?? null;
  const summary = summarizeWishlist(wishlist.records);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleItems = wishlist.records
    .filter((item) => item.status === view)
    .filter(
      (item) =>
        categoryFilter === "all" || item.category === categoryFilter,
    )
    .filter(
      (item) =>
        priorityFilter === "all" || item.priority === priorityFilter,
    )
    .filter(
      (item) =>
        !normalizedSearch ||
        item.name.toLocaleLowerCase().includes(normalizedSearch) ||
        item.description?.toLocaleLowerCase().includes(normalizedSearch),
    )
    .sort((a, b) => {
      if (view === "wanted") {
        const priorityOrder: Record<WishlistPriority, number> = {
          High: 0,
          Medium: 1,
          Low: 2,
        };
        return (
          priorityOrder[a.priority] - priorityOrder[b.priority] ||
          b.addedDate.localeCompare(a.addedDate) ||
          b.createdAt.localeCompare(a.createdAt)
        );
      }
      return (
        (b.purchasedDate ?? "").localeCompare(a.purchasedDate ?? "") ||
        b.updatedAt.localeCompare(a.updatedAt)
      );
    });

  function closeDialog() {
    setDialogMode("closed");
    setSelectedItemId(null);
    setOperationError("");
  }

  function openCreate() {
    setSelectedItemId(null);
    setEditorVersion((version) => version + 1);
    setOperationError("");
    setDialogMode("form");
  }

  function openDetails(item: WishlistItemRecord) {
    setSelectedItemId(item.id);
    setOperationError("");
    setDialogMode("detail");
  }

  function openEdit() {
    if (!selectedItem) return;
    setEditorVersion((version) => version + 1);
    setOperationError("");
    setDialogMode("form");
  }

  async function saveItem(input: WishlistItemInput) {
    if (selectedItemId) {
      await updateWishlistItem(selectedItemId, input);
      setDialogMode("detail");
      return;
    }
    await createWishlistItem(input);
    closeDialog();
  }

  async function savePurchase(date: string, price?: number) {
    if (!selectedItem) throw new Error("This Wishlist item is no longer available.");
    await markWishlistItemPurchased(selectedItem.id, date, price);
    setDialogMode("detail");
  }

  async function restoreItem() {
    if (!selectedItem) return;
    setOperationError("");
    try {
      await restoreWishlistItem(selectedItem.id);
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The item could not be restored to your Wishlist.",
      );
    }
  }

  async function removeItem() {
    if (!selectedItem) return;
    if (
      !window.confirm(
        `Delete “${selectedItem.name}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setOperationError("");
    try {
      await deleteWishlistItem(selectedItem.id);
      closeDialog();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The Wishlist item could not be deleted.",
      );
    }
  }

  const dialogTitle =
    dialogMode === "form"
      ? selectedItem
        ? "Edit item"
        : "Add to Wishlist"
      : dialogMode === "purchase"
        ? "Record purchase"
        : selectedItem?.name ?? "Wishlist item";

  return (
    <div className="data-screen wishlist-screen">
      <ScreenHeader
        action={
          <button className="capture-submit" onClick={openCreate} type="button">
            + Add item
          </button>
        }
        description="A quiet place for the things you may want, on your own terms."
        kicker="YOUR SPACE"
        title="Wishlist"
      />

      {wishlist.error && (
        <ErrorNotice message={wishlist.error} onRetry={wishlist.reload} />
      )}
      {operationError && <ErrorNotice message={operationError} />}

      {wishlist.isLoading ? (
        <LoadingState label="Loading your Wishlist from this device..." />
      ) : (
        <>
          <section aria-label="Wishlist summary" className="wishlist-overview">
            <div className="wishlist-overview-item">
              <span>Wanted</span>
              <strong>{summary.wantedCount}</strong>
              <small>
                {summary.wantedCount === 1 ? "item" : "items"} on your list
              </small>
            </div>
            <div className="wishlist-overview-item">
              <span>Estimated value</span>
              <strong>
                {formatCurrency(summary.estimatedTotal, preferences.currency)}
              </strong>
              <small>based on available estimates</small>
            </div>
            <div className="wishlist-overview-item">
              <span>Recorded purchases</span>
              <strong>
                {formatCurrency(summary.purchasedTotal, preferences.currency)}
              </strong>
              <small>
                {summary.recordedPurchaseCount} of {summary.purchasedCount}{" "}
                {summary.purchasedCount === 1 ? "purchase" : "purchases"} priced
              </small>
            </div>
          </section>

          <div className="wishlist-view-controls">
            <div aria-label="Wishlist status" className="wishlist-view-switch" role="group">
              <button
                aria-pressed={view === "wanted"}
                className={view === "wanted" ? "wishlist-view-active" : ""}
                onClick={() => setView("wanted")}
                type="button"
              >
                Wanted <span>{summary.wantedCount}</span>
              </button>
              <button
                aria-pressed={view === "purchased"}
                className={view === "purchased" ? "wishlist-view-active" : ""}
                onClick={() => setView("purchased")}
                type="button"
              >
                Purchased <span>{summary.purchasedCount}</span>
              </button>
            </div>
            <div className="wishlist-filters">
              <label className="finance-select-control">
                <span>Category</span>
                <select
                  aria-label="Filter Wishlist by category"
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategoryFilter(
                      value === "all" || isWishlistCategory(value)
                        ? value
                        : "all",
                    );
                  }}
                  value={categoryFilter}
                >
                  <option value="all">All categories</option>
                  {wishlistCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="finance-select-control">
                <span>Priority</span>
                <select
                  aria-label="Filter Wishlist by priority"
                  onChange={(event) => {
                    const value = event.target.value;
                    setPriorityFilter(
                      value === "all" || isWishlistPriority(value)
                        ? value
                        : "all",
                    );
                  }}
                  value={priorityFilter}
                >
                  <option value="all">All priorities</option>
                  {wishlistPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wishlist-search">
                <span className="sr-only">Search Wishlist</span>
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search items"
                  type="search"
                  value={search}
                />
              </label>
            </div>
          </div>

          <section
            aria-label={view === "wanted" ? "Wanted items" : "Purchased items"}
            className="wishlist-list-section"
          >
            {visibleItems.length ? (
              <ul className="wishlist-list">
                {visibleItems.map((item) => (
                  <WishlistRow
                    currency={preferences.currency}
                    item={item}
                    key={item.id}
                    onOpen={() => openDetails(item)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                action={
                  view === "wanted" && !wishlist.records.length ? (
                    <button className="text-button" onClick={openCreate} type="button">
                      Add something you have in mind
                    </button>
                  ) : undefined
                }
                description={
                  normalizedSearch || categoryFilter !== "all" || priorityFilter !== "all"
                    ? "Try another search or clear a filter."
                    : view === "wanted"
                      ? "Items you save will appear here. There is no need to decide right away."
                      : "Items you mark as purchased will stay available here."
                }
                title={
                  view === "wanted"
                    ? "Nothing on the list yet."
                    : "No purchases recorded."
                }
              />
            )}
          </section>
        </>
      )}

      <ModalDialog
        description={
          dialogMode === "form"
            ? selectedItem
              ? "Update the details without changing its purchase status."
              : "Keep an idea for later. You can decide when it feels right."
            : dialogMode === "purchase"
              ? "Record the date and optional price. This does not create a Finance expense."
              : "Details and actions for this Wishlist item."
        }
        onClose={closeDialog}
        open={dialogMode !== "closed"}
        title={dialogTitle}
      >
        {dialogMode === "form" ? (
          <WishlistEditor
            currency={preferences.currency}
            item={selectedItem}
            key={`${selectedItemId ?? "new"}-${editorVersion}`}
            onSave={saveItem}
          />
        ) : dialogMode === "purchase" && selectedItem ? (
          <WishlistPurchaseEditor
            currency={preferences.currency}
            onSave={savePurchase}
          />
        ) : (
          selectedItem && (
            <div className="wishlist-detail">
              {selectedItem.description?.trim() ? (
                <p className="wishlist-detail-description">
                  {selectedItem.description}
                </p>
              ) : (
                <p className="wishlist-detail-empty">No description added.</p>
              )}
              <div className="wishlist-detail-meta">
                <span>{selectedItem.category}</span>
                <span>{selectedItem.priority} priority</span>
                <span>Added {formatDateKey(selectedItem.addedDate)}</span>
              </div>
              <dl className="wishlist-detail-prices">
                <div>
                  <dt>Estimated price</dt>
                  <dd>
                    {selectedItem.estimatedPrice === undefined
                      ? "Not set"
                      : formatCurrency(
                          selectedItem.estimatedPrice,
                          preferences.currency,
                        )}
                  </dd>
                </div>
                {selectedItem.status === "purchased" && (
                  <>
                    <div>
                      <dt>Purchased</dt>
                      <dd>
                        {selectedItem.purchasedDate
                          ? formatDateKey(selectedItem.purchasedDate)
                          : "Date not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt>Purchase price</dt>
                      <dd>
                        {selectedItem.purchasePrice === undefined
                          ? "Not recorded"
                          : formatCurrency(
                              selectedItem.purchasePrice,
                              preferences.currency,
                            )}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              {selectedItem.productUrl && (
                <Link
                  className="wishlist-product-link"
                  href={selectedItem.productUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open product link
                </Link>
              )}
              {operationError && <ErrorNotice message={operationError} />}
              <div className="wishlist-detail-actions">
                <button className="text-button" onClick={openEdit} type="button">
                  Edit item
                </button>
                {selectedItem.status === "wanted" ? (
                  <button
                    className="text-button"
                    onClick={() => setDialogMode("purchase")}
                    type="button"
                  >
                    Mark as purchased
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => void restoreItem()}
                    type="button"
                  >
                    Restore to wanted
                  </button>
                )}
                <button
                  className="text-button wishlist-delete-action"
                  onClick={() => void removeItem()}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </ModalDialog>
    </div>
  );
}

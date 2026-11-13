export function requireNonBlank(value: string, field: string): void {
  if (!value.trim()) {
    throw new Error(`${field} is required.`);
  }
}

export function requirePositiveAmount(value: string): void {
  const amount = Number(value);
  if (!value || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be a number greater than zero.");
  }
}

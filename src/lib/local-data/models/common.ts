export type LocalRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecord<T extends LocalRecord> = Omit<
  T,
  keyof LocalRecord
>;

export type UpdateRecord<T extends LocalRecord> = Partial<CreateRecord<T>>;

export interface QueryOneOptions {
  populates?: any[];
  columns?: string;
  excludeColumns?: string;
}

export interface QueryOptions extends QueryOneOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?:
    | 1
    | -1
    | "asc"
    | "desc"
    | "ascending"
    | "descending"
    | {
        $meta: string;
      };
}

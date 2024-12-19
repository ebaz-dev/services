import mongoose, { Model } from "mongoose";
import { QueryOptions } from "./query-options";

const listAndCount = async (
  criteria: any,
  model: Model<any>,
  options?: QueryOptions
): Promise<{
  data: mongoose.Document[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  const columns = options && options.columns ? options.columns : "";
  const item = model.find(criteria, columns);

  if (options) {
    if (options.populates) {
      options.populates.forEach((populateItem: any) => {
        item.populate(populateItem);
      });
    }
    if (options.sortBy) {
      const sort: any = {};
      sort[options.sortBy] = options.sortDir || 1;
      item.sort(sort);
    }
    if (options.page) {
      item.skip((Number(options.page) - 1) * Number(options.limit || 0));
    }
    if (options.limit) {
      options.limit = Number(options.limit);
      item.limit(options.limit);
    }
    if (options.columns) {
      item.select(options.columns);
    }
  }

  const data = await item;
  const total = await model.countDocuments(criteria);
  let totalPages =
    total > 0
      ? Math.ceil(
          options && options.limit && options.limit > 0
            ? total / Number(options.limit)
            : total / total
        )
      : 0;
  let currentPage = Number(options?.page || 1);
  return { data, total, totalPages, currentPage };
};

export { listAndCount };

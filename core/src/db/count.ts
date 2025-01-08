import { Model } from "../lib/mongoose";
import { QueryOptions } from "./query-options";

const onlyCount = async (
  criteria: any,
  model: Model<any>,
  options?: QueryOptions
): Promise<{
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
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
  return { total, totalPages, currentPage };
};

export { onlyCount };

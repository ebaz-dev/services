import mongoose, { Model } from "mongoose";
import { QueryOptions } from "./query-options";

const aggregateAndCount = async (
  model: Model<any>,
  options: QueryOptions,
  aggregations: any[]
): Promise<{
  data: mongoose.Document[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  const listAggregates = aggregations;
  const countAggregates = aggregations.concat([
    {
      $count: "count",
    },
  ]);

  if (options.sortBy) {
    const sort: any = {};
    sort[options.sortBy] = options.sortDir || 1;
    listAggregates.push({ $sort: sort });
  }
  if (options.limit) {
    const limit = Number(options.limit);
    if (options.page) {
      const skip = (Number(options.page) - 1) * limit;
      listAggregates.push({ $skip: skip });
    }
    listAggregates.push({ $limit: limit });
  }
  const data = await model.aggregate(listAggregates);
  const count = await model.aggregate(countAggregates);
  const total = count[0] ? count[0].count : 0;
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

export { aggregateAndCount };

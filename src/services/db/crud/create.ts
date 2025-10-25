import { Delegate } from "@/types/models";
import { QueryConditionalConflict, QueryData, QueryErrorDefault, QueryOptions, QueryResult } from "../type";
import { handleDBServiceError } from "@/lib/error/handleDBError";
import { getDelegateName } from "../../../lib/db";
import { omit } from "@/lib/manipulate/object";

const base = async (model: Delegate, query: () => any, options: QueryOptions<any, any> | undefined) => {
  try {
    return await query();
  } catch (err) {
    const handled = handleDBServiceError(err, getDelegateName(model), options?.error);
    if (handled === null) return null;
    throw handled;
  }
};

export const createOne = <T extends Delegate, E extends QueryConditionalConflict | QueryErrorDefault>(
  model: T,
  data: QueryData<T["create"]>,
  options?: QueryOptions<T["create"], E>
): Promise<QueryResult<T["create"], E>> =>
  base(model, () => (model.create as Function)({ data, ...omit((options || {}) as any, ["error"]) }), options);

export const createMany = <T extends Delegate, E extends QueryConditionalConflict | QueryErrorDefault>(
  model: T,
  data: QueryData<T["createMany"]>,
  options?: QueryOptions<T["createMany"], E>
): Promise<QueryResult<T["createMany"], E>> =>
  base(model, () => (model.createMany as Function)({ data, ...omit((options || {}) as any, ["error"]) }), options);

export const createManyAndReturn = <T extends Delegate, E extends QueryConditionalConflict | QueryErrorDefault>(
  model: T,
  data: QueryData<T["createManyAndReturn"]>,
  options?: QueryOptions<T["createManyAndReturn"], E>
): Promise<QueryResult<T["createManyAndReturn"], E>> =>
  base(model, () => (model.createManyAndReturn as Function)({ data, ...omit((options || {}) as any, ["error"]) }), options);

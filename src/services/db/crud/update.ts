import { Delegate } from "@/types/models";
import { QueryConditionalPresent, QueryData, QueryError, QueryFilter, QueryOptions, QueryResult } from "../type";
import { handleDBServiceError } from "@/lib/error/handleDBError";
import { getDelegateName } from "../../../lib/db";
import { ServerError } from "@/services/server-error";

const base = async (model: Delegate, query: () => any, options: QueryOptions<any, any> | undefined) => {
  try {
    const errPresent = options?.error as QueryConditionalPresent | undefined;
    const q = await query();
    if (errPresent?.found instanceof ServerError && !(Array.isArray(q) && "count" in q && Object.keys(q).length === 1)) throw errPresent.found;
    return q;
  } catch (err) {
    const handled = handleDBServiceError(err, getDelegateName(model), options?.error);
    if (handled === null) return null;
    throw handled;
  }
};

export const updateOne = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["update"]>,
  data: QueryData<T["update"]>,
  options?: QueryOptions<T["update"], E>
): Promise<QueryResult<T["update"], E>> => base(model, () => (model.update as Function)({ where: filter, data, ...options }), options);

export const updateMany = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["updateMany"]>,
  data: QueryData<T["updateMany"]>,
  options?: QueryOptions<T["updateMany"], E>
): Promise<QueryResult<T["updateMany"], E>> => base(model, () => (model.updateMany as Function)({ where: filter, data, ...options }), options);

export const updateManyAndReturn = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["updateManyAndReturn"]>,
  data: QueryData<T["updateManyAndReturn"]>,
  options?: QueryOptions<T["updateManyAndReturn"], E>
): Promise<QueryResult<T["updateManyAndReturn"], E>> =>
  base(model, () => (model.updateManyAndReturn as Function)({ where: filter, data, ...options }), options);

export const updateById = <T extends Delegate, E extends QueryError>(
  model: T,
  id: string,
  data: QueryData<T["update"]>,
  options?: QueryOptions<T["update"], E>
): Promise<QueryResult<T["update"], E>> => base(model, () => (model.update as Function)({ where: { id }, data, ...options }), options);

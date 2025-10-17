import { Delegate } from "@/types/models";
import { QueryConditionalPresent, QueryError, QueryFilter, QueryOptions, QueryResult } from "../type";
import { handleDBServiceError } from "@/lib/error/handleDBError";
import { getDelegateName } from "../../../lib/db";
import { ServerError } from "@/services/server-error";

const base = async (model: Delegate, query: () => any, options: QueryOptions<any, any> | undefined) => {
  try {
    const errPresent = options?.error as QueryConditionalPresent | undefined;
    const q = await query();
    if (errPresent?.found instanceof ServerError && !("count" in q && Object.keys(q).length === 1)) throw errPresent.found;
    return q;
  } catch (err) {
    const handled = handleDBServiceError(err, getDelegateName(model), options?.error);
    if (handled === null) return null;
    throw handled;
  }
};

export const deleteOne = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["delete"]>,
  options?: QueryOptions<T["delete"], E>
): Promise<QueryResult<T["delete"], E>> => base(model, () => (model.delete as Function)({ where: filter, ...options }), options);

export const deleteMany = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["deleteMany"]>,
  options?: QueryOptions<T["deleteMany"], E>
): Promise<QueryResult<T["deleteMany"], E>> => base(model, () => (model.deleteMany as Function)({ where: filter, ...options }), options);

export const deleteById = <T extends Delegate, E extends QueryError>(
  model: T,
  id: string,
  options?: QueryOptions<T["delete"], E>
): Promise<QueryResult<T["delete"], E>> => base(model, () => (model.delete as Function)({ where: { id }, ...options }), options);

import { Delegate } from "@/types/models";
import { QueryConditionalPresent, QueryError, QueryFilter, QueryOptions, QueryResult } from "../type";
import { handleDBServiceError } from "@/lib/error/handleDBError";
import { getDelegateName } from "../../../lib/db";
import { ServerError } from "@/services/server-error";

const base = async (model: Delegate, query: () => any, options: QueryOptions<any, any> | undefined) => {
  try {
    const errPresent = options?.error as QueryConditionalPresent | undefined;
    const q = await query();
    if (errPresent?.found instanceof ServerError && !Array.isArray(q)) throw errPresent.found;
    return q;
  } catch (err) {
    const handled = handleDBServiceError(err, getDelegateName(model), options?.error);
    if (handled === null) return null;
    throw handled;
  }
};

export const getOne = <T extends Delegate, E extends QueryError>(
  model: T,
  filter: QueryFilter<T["findFirstOrThrow"]>,
  options?: QueryOptions<T["findFirstOrThrow"], E>
): Promise<QueryResult<T["findFirstOrThrow"], E>> => base(model, () => (model.findFirstOrThrow as Function)({ where: filter, ...options }), options);

export const getMany = <T extends Delegate>(
  model: T,
  filter: QueryFilter<T["findMany"]>,
  options?: QueryOptions<T["findMany"]>
): Promise<QueryResult<T["findMany"]>> => base(model, () => (model.findMany as Function)({ where: filter, ...options }), options);

export const getUnique = async <T extends Delegate>(
  model: T,
  filter: QueryFilter<T["findUniqueOrThrow"]>,
  options?: QueryOptions<T["findUniqueOrThrow"]>
): Promise<QueryResult<T["findUniqueOrThrow"]>> => base(model, () => (model.findUniqueOrThrow as Function)({ where: filter, ...options }), options);

export const getById = async <T extends Delegate>(
  model: T,
  id: string,
  options?: QueryOptions<T["findFirstOrThrow"]>
): Promise<QueryResult<T["findFirstOrThrow"]>> => base(model, () => (model.findFirstOrThrow as Function)({ where: { id }, ...options }), options);

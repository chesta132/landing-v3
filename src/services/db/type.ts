import { ServerError } from "../server-error";

type Func = (...args: any) => any;
type PromiseReturn<T extends Func> = Awaited<ReturnType<T>>;

export type QueryType<T extends Func> = NonNullable<Parameters<T>[0]>;

export type QueryFilter<T extends Func> = QueryType<T>["where"];
export type QueryOptions<T extends Func, E extends QueryError = QueryErrorDefault> = Omit<QueryType<T>, "where" | "data"> & {
  error?: E;
};
export type QueryData<T extends Func> = QueryType<T>["data"];

export type QueryConditionalConflict = { exists?: ServerError<any> | null; unique?: ServerError<any> | null };
export type QueryConditionalMissing = { notFound?: ServerError<any> | null };
export type QueryConditionalPresent = { found?: ServerError<any> | null };

export type QueryConditionalError = QueryConditionalMissing | QueryConditionalPresent | QueryConditionalConflict;
export type QueryErrorDefault = ServerError<any> | null | (() => ServerError<any>);

export type QueryError = QueryErrorDefault | QueryConditionalError;

export type QueryResult<F extends Func, E extends QueryError = QueryErrorDefault> = [E] extends [null]
  ? PromiseReturn<F> | null
  : [E] extends [Record<keyof QueryConditionalPresent, ServerError<any>>]
  ? null
  : [null] extends [E[Exclude<keyof E, keyof QueryConditionalPresent>]]
  ? PromiseReturn<F> | null
  : PromiseReturn<F>;

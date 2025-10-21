import { PAGINATION_LIMIT } from "@/config";
import { QueryValue } from "@/types/server";

type ParsePaginationQueryProps = Record<"sort" | "sortBy" | "offset", QueryValue>;

export const parsePaginationQuery = <T extends string = string>(query: ParsePaginationQueryProps) => {
  const { sort, offset, sortBy } = query;
  const limit = PAGINATION_LIMIT;
  const skip = Number(offset?.toString()) || 0;
  const orderBy = (typeof sortBy === "string" ? { [sortBy]: sort === "asc" ? sort : "desc" } : undefined) as { [K in T]: "asc" | "desc" } | undefined;
  return { limit, skip, orderBy };
};

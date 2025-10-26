import { sortValue } from "@/services/db/crud";
import z from "zod";

export abstract class RouteValidator {
  static createGetManyValidator<T extends string>(defaultModel: Record<T, any>) {
    return z.object({
      offset: z.coerce.number().optional(),
      sortBy: z.enum(Object.typedKeys(defaultModel)).optional(),
      sort: z.enum(sortValue).optional(),
      isRecycled: z.coerce.boolean().optional(),
    }).strip();
  }
}

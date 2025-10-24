import { $Enums, Tech } from "@prisma/client";
import { infer as ZodInfer } from "zod";
import { TechController } from "../_controllers/tech";

declare const { routeOptions } = TechController;
export namespace TechPayload {
  // Body
  type CreateBody = ZodInfer<typeof routeOptions.create.bodyValidator>;
  type UpdateBody = ZodInfer<typeof routeOptions.update.bodyValidator>;
  type UpdateManyBody = ZodInfer<typeof routeOptions.updateMany.bodyValidator>;
  type SoftDeleteManyBody = ZodInfer<typeof routeOptions.softDeleteMany.bodyValidator>;
  type RestoreManyBody = ZodInfer<typeof routeOptions.restoreMany.bodyValidator>;

  // Param
  type SingleParam = ZodInfer<typeof routeOptions.singleParam.paramValidator>;

  // Query
  type GetManyQuery = ZodInfer<typeof routeOptions.getMany.queryValidator>;
}

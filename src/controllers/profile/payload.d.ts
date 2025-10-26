import { Profile } from "@prisma/client";
import { infer as ZodInfer } from "zod";
import { ProfileController } from "../../../controllers/profile";

declare const { routeOptions } = ProfileController;
export namespace ProfilePayload {
  // Body
  type CreateBody = ZodInfer<typeof routeOptions.create.bodyValidator>;
  type UpdateBody = ZodInfer<typeof routeOptions.update.bodyValidator>;

  // Param
  type SingleParam = ZodInfer<typeof routeOptions.singleParam.paramValidator>;

  // Query
  type DeleteQuery = ZodInfer<typeof routeOptions.delete.queryValidator>;
}

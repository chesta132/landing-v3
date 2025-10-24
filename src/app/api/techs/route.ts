import { Route } from "@/lib/route";
import { TechController } from "../_controllers/tech";

export default Route.create(
  {
    GET: TechController.getMany,
    PUT: TechController.updateMany,
    POST: TechController.create,
    DELETE: TechController.softDeleteMany,
  },
  {
    POST: TechController.routeOptions.create,
    PUT: TechController.routeOptions.updateMany,
    DELETE: TechController.routeOptions.softDeleteMany,
  }
);

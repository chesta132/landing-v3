import { Route } from "@/services/route";
import { TechController } from "../../../../controllers/tech";

export default Route.create(
  { GET: TechController.get, DELETE: TechController.softDelete, PUT: TechController.update },
  { PUT: TechController.routeOptions.update }
);

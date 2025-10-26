import { ProfileController } from "../../../../controllers/profile";
import { Route } from "@/services/route";

export default Route.create(
  { PUT: ProfileController.update, DELETE: ProfileController.delete },
  { PUT: ProfileController.routeOptions.update, ...ProfileController.routeOptions.singleParam }
);

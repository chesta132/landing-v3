import { ProfileController } from "../../../controllers/profile";
import { Route } from "@/services/route";

export default Route.create(
  {
    GET: ProfileController.get,
    POST: ProfileController.create,
  },
  { POST: ProfileController.routeOptions.create }
);

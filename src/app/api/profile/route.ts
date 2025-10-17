import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../_controller/profile";

export default createRoute(
  {
    GET: ProfileController.get,
    POST: ProfileController.create,
  },
  undefined,
  { POST: ProfileController }
);

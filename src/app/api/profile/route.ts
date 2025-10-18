import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../_controller/profile";
import { Profile as PProfile } from "@prisma/client";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      get: BuildEndpoint<{ path: "/profile"; response: InferResponseByHandler<typeof ProfileController.get> }>;
      post: BuildEndpoint<{
        path: "/profile";
        response: InferResponseByHandler<typeof ProfileController.create>;
        body: Pick<PProfile, "bio" | "avatarUrl" | "name"> & Partial<Pick<PProfile, "location">>;
      }>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}

export default createRoute(
  {
    GET: ProfileController.get,
    POST: ProfileController.create,
  },
  undefined,
  { POST: ProfileController }
);

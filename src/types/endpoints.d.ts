import { Replied } from "@/services/reply/type";
import { AllowedMethods, ApiRequest, ApiRequest_, ApiResponse, Handler } from "@/lib/route/types";

type DefaultRootEndpoint = Record<Lowercase<AllowedMethods>, never>;

namespace Endpoints {
  interface Profile extends DefaultRootEndpoint {}
  interface Auth extends DefaultRootEndpoint {}
  interface Social extends DefaultRootEndpoint {}
  interface Project extends DefaultRootEndpoint {}
  interface Tech extends DefaultRootEndpoint {}
}
interface Endpoints {}

export type Endpoint = { path: string; param: string; response: any; query: Record<string, any>; body: any };
export type BuildEndpoint<E extends string, H extends Handler, Success = true> = H extends (
  req: ApiRequest<infer B, infer P, infer Q>,
  res: ApiResponse<infer R>,
  ...rest: any[]
) => Promise<void> | void
  ? { path: E; param: P; response: Replied<R, Success>; query: Q; body: B }
  : never;

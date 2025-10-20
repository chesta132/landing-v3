import { AllowedMethods, ApiRequest, ApiResponse, Handler } from "@/types/server";

namespace Endpoints {
  interface Profile extends Record<Lowercase<AllowedMethods>, never> {}
  interface Auth extends Record<Lowercase<AllowedMethods>, never> {}
  interface Social extends Record<Lowercase<AllowedMethods>, never> {}
}
interface Endpoints {}

export type Endpoint = { path: string; param: string; response: any; query: Record<string, any>; body: any };
export type BuildEndpoint<E extends string, H extends Handler> = H extends (
  req: ApiRequest<infer B, infer P, infer Q>,
  res: ApiResponse<infer R>,
  ...rest: any[]
) => Promise<void> | void
  ? { path: E; param: P; response: R; query: Q; body: B }
  : never;

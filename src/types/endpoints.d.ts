import { AllowedMethods, ApiRequest, ApiResponse, Handler } from "@/types/server";

namespace Endpoints {
  interface Profile extends Record<Lowercase<AllowedMethods>, never> {}
}
interface Endpoints {}

export type Endpoint = { path: string; param: string; response: any; query: Record<string, any>; body: any };
export type BuildEndpoint<E extends Partial<Endpoint>> = Omit<Record<keyof Endpoint, never>, keyof E> & E;
export type InferResponseByHandler<H extends Handler> = H extends (req: ApiRequest, res: ApiResponse<infer R>) => Promise<void> | void ? R : never;

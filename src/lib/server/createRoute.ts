import { Reply } from "@/services/reply";
import { ServerError } from "@/services/server-error";
import { AllowedMethods, ApiRequest, ApiResponse, BodyableMethods, Handlers, Recoverer } from "@/types/server";
import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";
import { validateRequires } from "./validate";
import { handleServerError } from "../error/handleServerError";

export type CreateRouteOptionsBase = { neededBody?: string[] };
export type CreateRouteOptions<H extends Handlers> = Partial<Record<Extract<keyof H, BodyableMethods>, CreateRouteOptionsBase>>;

export function createRoute<H extends Handlers>(handlers: H, recover?: Recoverer, options?: CreateRouteOptions<H>) {
  const available = Object.entries(handlers)
    .filter((h) => typeof h[1] === "function")
    .map((h) => h[0]) as AllowedMethods[];

  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const cookieStore = await cookies();
      const reply = new Reply(res, { cookieStore });
      (res as ApiResponse).reply = reply;
      const { neededBody } = (options && options[req.method as BodyableMethods]) || {};
      if (neededBody) validateRequires(neededBody, req.body || {});

      const handler = handlers[req.method as AllowedMethods];
      if (handler) return await handler(req as ApiRequest, res as ApiResponse);

      return new ServerError("METHOD_NOT_ALLOWED", { allowed: available, method: req.method! }).exec(reply);
    } catch (err) {
      if (recover) return await recover(err, req as ApiRequest, res as ApiResponse);
      else return handleServerError(err, (res as ApiResponse).reply);
    }
  };
}

import { createReply } from "@/services/reply";
import { ServerError } from "@/services/server-error";
import { AllowedMethods, ApiRequest, ApiResponse, BodyableMethods, Handler, Handlers, Recoverer } from "@/types/server";
import { NextApiRequest, NextApiResponse } from "next";
import { validatePayload } from "./validate";
import { handleServerError } from "../error/handleServerError";
import { authMiddleware } from "@/app/api/_middlewares/auth";
import { ZodArray, ZodObject } from "zod";
import { pick } from "../manipulate/object";

export type CreateRouteOptionsBase = { bodyValidator?: ZodObject | ZodArray<ZodObject> };
export type CreateRouteOptions<H extends Handlers> = Partial<Record<Extract<keyof H, BodyableMethods>, CreateRouteOptionsBase>> & {
  recover?: Recoverer;
};

export abstract class Route {
  private static exec = async (handler: Handler, req: ApiRequest, res: ApiResponse) => {
    if (handler.length >= 3) {
      const admin = await authMiddleware(req, res);
      return await handler(req as ApiRequest<any & never>, res, admin);
    } else {
      return await (handler as Function)(req as ApiRequest<any & never>, res);
    }
  };

  private static async injectReply(request: NextApiRequest, response: NextApiResponse) {
    const res = await createReply(response);
    const req = request as ApiRequest;
    return { req, res };
  }

  /**
   * Creates a Next.js API route handler with multiple HTTP methods support
   *
   * @param defaultHandlers - Object containing handler functions for each HTTP method
   * @param arrayOnBodyHandlers - Optional handlers specifically for array body requests
   * @param options - Optional per-method config for body validation and error recovery
   * @returns Next.js API route handler
   *
   * @description
   * This function automatically:
   * - Detects body type (array vs object) and routes to appropriate handler
   * - Validates required body fields if specified in options
   * - Triggers auth middleware when handler has 3+ parameters
   * - Handles errors with custom recoverer or default error handler
   *
   * @example
   * // Basic usage
   * export default createRoute({
   *   GET: async (req, res) => res.reply.ok({ data: 'hello' }),
   *   POST: async (req, res) => res.reply.created({ data: req.body })
   * });
   *
   * @example
   * // With body validation and error recovery
   * export default createRoute(
   *   { POST: async (req, res) => res.reply.created({ user: req.body }) },
   *   {
   *     POST: { neededBody: ['email', 'password'] },
   *     recover: async (err, req, res) => res.reply.internalError('Custom error')
   *   }
   * );
   *
   * @example
   * // With auth (3 params triggers authMiddleware)
   * export default createRoute({
   *   DELETE: async (req, res, admin) => res.reply.ok({ deleted: true })
   * });
   */
  static create<H extends Handlers>(handlers: H, options?: CreateRouteOptions<H>) {
    const available = Object.entries(handlers)
      .filter((h) => typeof h[1] === "function")
      .map((h) => h[0]) as AllowedMethods[];

    return async (request: NextApiRequest, response: NextApiResponse) => {
      try {
        const { req, res } = await this.injectReply(request, response);

        const { bodyValidator } = (options && options[req.method as BodyableMethods]) || {};

        if (bodyValidator) {
          const shape = bodyValidator instanceof ZodArray ? bodyValidator.element.shape : bodyValidator.shape;
          req.body = Object.isObject(req.body)
            ? pick(req.body, Object.keys(shape))
            : Array.isArray(req.body)
            ? req.body.map((b) => pick(b, Object.keys(shape)))
            : req.body;
          validatePayload(bodyValidator, req.body);
        }

        const handler = handlers[req.method as AllowedMethods];
        if (handler) {
          return this.exec(handler, req, res);
        }

        return new ServerError("METHOD_NOT_ALLOWED", {
          allowed: available,
          method: req.method!,
        }).exec(res.reply);
      } catch (err) {
        if (options?.recover) return await options.recover(err, request as ApiRequest<any & never>, response as ApiResponse);
        else return handleServerError(err, (response as ApiResponse).reply);
      }
    };
  }

  /**
   * Creates a route handler that splits execution based on body type (object or array)
   *
   * @param objectHandler - Handler function for object body requests
   * @param arrayHandler - Handler function for array body requests
   * @returns Next.js API route handler
   *
   * @description
   * Automatically detects body type and routes to the appropriate handler.
   * Split between single and bulk operations.
   *
   * @example
   * export default Route.create({
   *   POST: Route.splitBody(
   *     ProjectController.createOne,
   *     ProjectController.createMany
   *   )
   * });
   */
  static splitBody(objectHandler: Handler, arrayHandler: Handler) {
    return async (request: NextApiRequest, response: NextApiResponse) => {
      const { req, res } = await this.injectReply(request, response);
      const type = Array.isArray(req.body) ? "array" : typeof req.body === "object" ? "object" : null;
      if (type === "array") {
        return await this.exec(arrayHandler, req, res);
      } else if (type === "object") {
        return await this.exec(objectHandler, req, res);
      } else {
        return new ServerError("CLIENT_TYPE", { field: "body", details: "Body must be an object or array" }).exec(res.reply);
      }
    };
  }
}

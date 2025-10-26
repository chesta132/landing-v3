import { ServerError } from "@/services/server-error";
import {
  AllowedMethods,
  ApiRequest,
  ApiResponse,
  BodyableMethods,
  Handler,
  Handlers,
  CreateRouteOptions,
  ParamValidator,
  QueryValidator,
} from "@/services/route/types";
import { NextApiRequest, NextApiResponse } from "next";
import { handleServerError } from "../../lib/error/handleServerError";
import { authMiddleware } from "@/middlewares/api/auth";
import { ZodArray, ZodObject } from "zod";
import { Reply } from "@/services/reply";

export abstract class Route {
  private static exec = async (handler: Handler, req: ApiRequest, res: ApiResponse) => {
    if (handler.length >= 3) {
      const admin = await authMiddleware(req, res);
      return await handler(req as ApiRequest<any & never>, res, admin);
    } else {
      return await (handler as Function)(req as ApiRequest<any & never>, res);
    }
  };

  private static injectReply(request: NextApiRequest, response: NextApiResponse) {
    const reply = new Reply(request, response);
    (response as ApiResponse).reply = reply;
    const res = response as ApiResponse;
    const req = request as ApiRequest;
    return { req, res };
  }

  private static validatePayload(from: any, validator: ZodObject | ZodArray, on: string) {
    const valid = validator.safeParse(from);
    if (valid.error) {
      const missingFields = valid.error.issues
        .filter((i) => i.code === "invalid_type" && i.path.every((k) => from?.[k] === undefined))
        .flatMap((i) => i.path);
      if (missingFields.length >= 1) {
        throw new ServerError("MISSING_FIELDS", { field: missingFields.join(", "), on });
      } else {
        const fields = valid.error.issues.flatMap((i) => i.path);
        throw new ServerError("CLIENT_TYPE", { field: fields.join(", "), on });
      }
    }
    return valid.data;
  }

  private static validateQuery(source: ApiRequest["query"], { param, query }: RequireAtLeastOne<{ param: ParamValidator; query: QueryValidator }>) {
    const validator = (param && query ? param.extend(query.shape) : query ? query : param) as QueryValidator & ParamValidator;
    return this.validatePayload(source, validator, "query");
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
      const { req, res } = this.injectReply(request, response);
      try {
        let { bodyValidator, paramValidator, queryValidator } = (options && options[req.method as BodyableMethods]) || {};
        const { paramValidator: globalParamValidator } = options || {};

        if (bodyValidator) req.body = this.validatePayload(req.body, bodyValidator, "body");

        if (globalParamValidator && paramValidator) {
          paramValidator = paramValidator.extend(globalParamValidator.shape);
        } else if (globalParamValidator) {
          req.query = this.validateQuery(req.query, { param: globalParamValidator });
        } else if (paramValidator || queryValidator) {
          req.query = this.validateQuery(req.query, { param: paramValidator as ParamValidator, query: queryValidator });
        }

        const handler = handlers[req.method as AllowedMethods];
        if (handler) return await this.exec(handler, req, res);

        return new ServerError("METHOD_NOT_ALLOWED", {
          allowed: available,
          method: req.method!,
        }).exec(res.reply);
      } catch (err) {
        if (options?.recover) return await options.recover(err, request as ApiRequest<any & never>, response as ApiResponse);
        else return handleServerError(err, res.reply);
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
      const { req, res } = this.injectReply(request, response);
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

import { Reply } from "@/services/reply";
import { NextApiRequest, NextApiResponse } from "next";

export type AllowedMethods = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
export type BodyableMethods = "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequest extends NextApiRequest {}
export interface ApiResponse<Data = any> extends NextApiResponse<Data> {
  reply: Reply<Data>;
}

export type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;
export type Recoverer = (err: unknown, req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export type Handlers = RequireAtLeastOne<Record<AllowedMethods, Handler>>;

import { Reply } from "@/services/reply";
import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";

export interface ApiRequest extends NextApiRequest {}

export interface ApiResponse<Data = any> extends NextApiResponse<Data> {
  reply: Reply<Data>;
}

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export function createHandler(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const cookieStore = await cookies();
    (res as ApiResponse).reply = new Reply(res, { cookieStore });

    return await handler(req as ApiRequest, res as ApiResponse);
  };
}

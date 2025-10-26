import { Reply } from "@/services/reply";
import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  const reply = new Reply(req, res);
  reply.error({ code: "NOT_FOUND", message: `Can not ${req.method} ${req.url}` }).fail();
};

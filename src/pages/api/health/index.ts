import { Route } from "@/services/route";

export default Route.create({
  GET: (req, { reply }) => {
    reply.success({ status: "Server OK" }).respond();
  },
  FALLBACK: (req, { reply }, admin) => {
    if ((req.body as any).sendAdmin) reply.success({ status: "Auth OK", admin }).respond();
    else reply.success({ status: "Auth OK" }).respond();
  },
});

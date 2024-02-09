import { FastifyInstance } from "fastify";
import { indexController } from "./controller/indexController";
import { loginController } from "./controller/loginController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(indexController, { prefix: "/" });
  fastify.register(loginController, { prefix: "/login" });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function loginController(fastify: FastifyInstance) {
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply) {
      reply.send({
        pubeAID: 'lajksjon329oabdsu1',
      });
    },
  );

  fastify.post(
    '/',
    async function (request: FastifyRequest, reply: FastifyReply) {
      // 1. Decrypt request.body
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { username, password } = request.body;

      const user = await authenticateUser(username, password);

      if (user) {
        reply.send({ success: true, message: 'Success', user });
      } else {
        reply.code(401).send({ success: false, message: 'Error' });
      }
    },
  );
}

async function authenticateUser(username: string, password: string) {
  if (username === 'bob' && password === 'pass') {
    return { id: 1, username: 'bob', pubeAID: 'lajksjon329oabdsu1' };
  }
  return null;
}

export { loginController };

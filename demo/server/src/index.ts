import app from './app';

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;

app.listen({ port: FASTIFY_PORT });

console.log(`🚀  Server running on port http://localhost:${FASTIFY_PORT}`);
console.log(`Route index: /`);
console.log(`Route index: /login`);

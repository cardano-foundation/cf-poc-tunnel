import fastify from 'fastify';
import cors from '@fastify/cors';
import router from './router';
const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== 'development'),
});

server.register(cors, () => {
  return (req, callback) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true,
    };

    // do not include CORS headers for requests from localhost
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (/^localhost$/m.test(req.headers.origin)) {
      corsOptions.origin = false;
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions);
  };
});

// Middleware: Router
//server.register(cors);
server.register(router);

export default server;

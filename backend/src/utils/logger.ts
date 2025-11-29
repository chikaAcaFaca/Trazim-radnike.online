import pinoModule from 'pino';
import { isDev } from '../config/env.js';

const pino = (pinoModule.default || pinoModule) as typeof pinoModule.default;

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const requestLogger = pino({
  level: 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageFormat: '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
        },
      }
    : undefined,
});

const pino = require('pino')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.BUN_TEST

export const logger = isTest 
    ? pino({ level: 'silent' }) 
    : pino({
        level: 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
    })
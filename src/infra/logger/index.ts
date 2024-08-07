import { timeStamp } from 'console';
import { transports, format, createLogger, Logger } from 'winston';

export const logger: Logger = createLogger({
    level: process.env.ENV === 'prod' ? 'info' : 'debug',
    transports: [
        new transports.Console({
            format: format.simple(),
        }),
        new transports.File({ dirname: './logs', filename: 'combined.log' })
    ],
    exitOnError: true,
});

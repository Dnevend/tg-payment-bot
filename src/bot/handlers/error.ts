import { BotError } from 'grammy';
import { logger } from '../../infra';
import { BotContext } from '@/types/bot';

const errorHandler = (error: BotError<BotContext>) => {
    logger.error(error.message);
};

export default {
    handler: errorHandler,
};

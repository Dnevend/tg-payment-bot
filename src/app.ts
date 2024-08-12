import dotenv from 'dotenv'
import { Bot, type Context, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { BotContext, SessionData } from './types/bot'

import { checkTransaction, startPaymentProcess } from './bot/handlers/payment'
import error from './bot/handlers/error'
import handleDonate from './bot/handlers/donate'
import { FileAdapter } from '@grammyjs/storage-file'
import { DEFAULT_SESSION } from './infra/const'
import { logger } from './infra'

dotenv.config()

const isDevEnv = process.env.ENV === 'dev'

async function runApp() {
    console.log("Starting app...")

    // Handler of all errors, in order to prevent the bot from stopping
    process.on("uncaughtException", function (exception) {
        console.log(exception);
    });

    const bot = new Bot<BotContext>(process.env.BOT_TOKEN!, {
        client: {
            baseFetchConfig: {
                agent: isDevEnv ? new HttpsProxyAgent('http://127.0.0.1:7890') : null
            },
            environment: isDevEnv ? 'test' : 'prod'
        }
    })

    bot.errorHandler = error.handler
    bot.catch((err) => {
        console.log("🐞 => runApp => err:", err);
    })

    // Set the initial data of our session
    bot.use(session<SessionData, BotContext>({
        initial: () => (DEFAULT_SESSION),
        getSessionKey: (ctx) => String(ctx.from?.id),
        storage: new FileAdapter({ dirName: 'sessions' }),
    }));

    // Install the conversation plugin
    bot.use(conversations());
    bot.use(createConversation(startPaymentProcess));

    bot.callbackQuery('donate', async (ctx: BotContext) => {
        await ctx.conversation.enter('startPaymentProcess')
    })
    bot.callbackQuery('check_transaction', checkTransaction)

    bot.on('pre_checkout_query', (ctx: BotContext) => {
        try {
            if (!ctx.preCheckoutQuery) {
                logger.error('Pre-checkout query is missing');
                return;
            }

            ctx.answerPreCheckoutQuery(true)
        } catch (err) {
            logger.error('Error handling pre-checkout query:', err)

            try {
                ctx.answerPreCheckoutQuery(false, {
                    error_message: 'An unexpected error occurred. Please try again later.'
                })
            } catch (answerErr) {
                logger.error('Error answer pre-checkout query:', answerErr)
            }
        }
    })

    bot.on(':successful_payment', ctx => {
        logger.info(ctx.message?.successful_payment)
        ctx.reply('starts-donate-success').catch(console.error)
    })

    // Bind command
    bot.command('donate', handleDonate);
    bot.command('help', (ctx: Context) => {
        return ctx.react('👍')
    })

    // Set commands menu
    await bot.api.setMyCommands([
        { command: "donate", description: "Donate for repository" },
        { command: "help", description: "Show help text" },
    ]);

    // Start bot
    await bot.init()
    bot.start({
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
    })
    console.info(`Bot @${bot.botInfo.username} is up and running`);
}

void runApp()
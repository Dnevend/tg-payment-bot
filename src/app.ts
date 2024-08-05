import dotenv from 'dotenv'
import { Bot, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'

import handleStart from './bot/handlers/start'
import { exit } from 'process'

import { BotContext } from './types/bot'

dotenv.config()

async function runApp() {
    console.log("Starting app...")

    // Handler of all errors, in order to prevent the bot from stopping
    process.on("uncaughtException", function (exception) {
        console.log(exception);
    });

    if (!process.env.BOT_TOKEN) {
        exit(1)
    }

    const bot = new Bot<BotContext>(process.env.BOT_TOKEN)

    // Set the initial data of our session
    bot.use(session({ initial: () => ({ amount: 0, comment: "" }) }));
    // Install the conversation plugin
    bot.use(conversations());

    bot.command('start', handleStart)

    // Start bot
    await bot.init()
    bot.start()
    console.info(`Bot @${bot.botInfo.username} is up and running`);
}

void runApp()
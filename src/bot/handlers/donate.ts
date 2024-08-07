import { Context, InlineKeyboard } from "grammy";
export default async function handleDonate(ctx: Context) {
    const menu = new InlineKeyboard()
        .text("Donate", "donate")
        .row()
        .url('Donate Detail', 'https://github.com/Dnevend/tg-3000-bot')

    await ctx.reply(
        `Hello ${ctx.from?.first_name}! Welcome to the donate bot.`,
        { reply_markup: menu, parse_mode: "HTML" }
    );
}
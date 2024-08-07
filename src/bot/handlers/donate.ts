import { REPOSITORY } from "../../infra/const";
import { Context, InlineKeyboard } from "grammy";
export default async function handleDonate(ctx: Context) {
    const menu = new InlineKeyboard()
        .text("Donate", "donate")
        .row()
        .url('Donate Detail', REPOSITORY.url)

    await ctx.reply(
        `Hello ${ctx.from?.first_name}! Welcome to the donate bot.`,
        { reply_markup: menu, parse_mode: "HTML" }
    );
}
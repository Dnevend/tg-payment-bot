import { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { BotContext } from "@/types/bot";

export async function startPaymentProcess(conversation: Conversation<BotContext>, ctx: BotContext) {
    // Remove the loading clock
    await ctx.answerCallbackQuery();

    await ctx.replyWithPhoto(
        "https://github.html.zone/dnevend/tg-3000-bot",
        {
            caption:
                "Send the amount you would like to donate.",
        }
    );

    // Wait until the user enters the number
    const count = await conversation.form.number();

    // Get the total cost: multiply the number of portions by the price of the 1 portion
    const amount = count * 1;
    // Generate random comment
    const comment = "dnevend/tg-3000-bot";
    // Save data to the session
    conversation.session.amount = amount;
    conversation.session.comment = comment;

    ctx.api.sendInvoice(ctx.chat!.id, 'Donate', 'Donate for public repository.', `donate:${ctx.chat?.id}:${amount}`, 'XTR', [{ label: 'Donation', amount: amount }])

    const menu = new InlineKeyboard();

    await ctx.reply(
        `Thanks for your donate.`,
        { reply_markup: menu, parse_mode: "HTML" }
    );
}

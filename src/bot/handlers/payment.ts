import { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { BotContext } from "@/types/bot";
import { REPOSITORY } from "../../infra";
import { generatePaymentLink, verifyTransactionExistance } from "../../utils/ton";
import 'dotenv/config'
import { Address } from "ton";

export async function startPaymentProcess(conversation: Conversation<BotContext>, ctx: BotContext) {
    // Remove the loading clock
    await ctx.answerCallbackQuery();

    const keyboard = new InlineKeyboard()
        .text('💎 Pay with TON', 'pay_with_ton')
        .row()
        .text('🌟 Pay with Stars', 'pay_with_stars')

    const paymentWay = await conversation.waitForCallbackQuery(["pay_with_ton", "pay_with_stars"], {
        otherwise: (ctx) => ctx.reply('选择支付方式！', { reply_markup: keyboard })
    })

    await ctx.replyWithPhoto(
        REPOSITORY.cover,
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

    if (paymentWay.match === 'pay_with_ton') {
        const tonhubPaymentLink = generatePaymentLink(process.env.OWNER_WALLET!, amount, comment, 'tonhub')
        const tonkeeperPaymentLink = generatePaymentLink(process.env.OWNER_WALLET!, amount, comment, 'tonkeeper')

        const menu = new InlineKeyboard()
            .url("Click to pay in TonHub", tonhubPaymentLink)
            .row()
            .url("Click to pay in TonKeeper", tonkeeperPaymentLink)
            .row()
            .text(`I sent ${amount} TON`, "check_transaction");

        await ctx.reply(
            `
    Fine, all you have to do is transfer ${amount} TON to the wallet <code>${process.env.OWNER_WALLET}</code> with the comment <code>${comment}</code>.
    
    <i>WARNING: I am currently working on ${process.env.NETWORK}</i>
    
    P.S. You can conveniently make a transfer by clicking on the appropriate button below and confirm the transaction in the offer`,
            { reply_markup: menu, parse_mode: "HTML" }
        );
    } else if (paymentWay.match === 'pay_with_stars') {
        ctx.api.sendInvoice(ctx.chat!.id, 'Donate', 'Donate for public repository.', `donate:${ctx.chat?.id}:${amount}`, 'XTR', [{ label: 'Donation', amount: amount }])
    }

    await ctx.reply(`Thanks for your donate.`);
}


export async function checkTransaction(ctx: BotContext) {
    console.log('ctx =>', ctx.session)
    const verifyRes = await verifyTransactionExistance(process.env.OWNER_WALLET as unknown as Address, ctx.session.amount, ctx.session.comment)
    console.log('transaction check success :', verifyRes)
}
import type { ConversationFlavor } from "@grammyjs/conversations";
import type { Context, SessionFlavor } from "grammy";

interface SessionData {
    amount: number;
    comment: string;
}

type BotContext = Context & ConversationFlavor & SessionFlavor<SessionData>;

export type { BotContext, SessionData }
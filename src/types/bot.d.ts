export type BotContext = Context & SessionFlavor<{
    amount: number;
    comment: string;
}>;
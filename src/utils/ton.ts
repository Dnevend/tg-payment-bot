import { toNano, HttpApi, Address, fromNano } from "ton";

export async function verifyTransactionExistance(toWallet: Address, value: number, comment: string) {
    const endpoint =
        process.env.NETWORK === "mainnet"
            ? "https://toncenter.com/api/v2/jsonRPC"
            : "https://testnet.toncenter.com/api/v2/jsonRPC";

    const httpClient = new HttpApi(
        endpoint,
        {
            apiKey: process.env.TONCENTER_TOKEN
        }
    );

    const transactions = await httpClient.getTransactions(toWallet, {
        limit: 100,
    });

    let incomingTransactions = transactions.filter(
        (tx) => Object.keys(tx.out_msgs).length === 0
    );

    for (let i = 0; i < incomingTransactions.length; i++) {
        let tx = incomingTransactions[i];
        // Skip the transaction if there is no comment in it
        if (!tx.in_msg?.msg_data) {
            continue;
        }

        // Convert transaction value from nano
        let txValue = fromNano(tx.in_msg.value);
        // Get transaction comment 
        let txComment = tx.in_msg.message
        if (txComment === comment && txValue === value.toString()) {
            return true;
        }
    }

    return false;
}


export function generatePaymentLink(toWallet: string, amount: number | string | bigint, comment: string, app: 'tonhub' | 'tonkeeper') {
    if (app === "tonhub") {
        return `https://tonhub.com/transfer/${toWallet}?amount=${toNano(
            amount
        )}&text=${comment}`;
    }

    return `https://app.tonkeeper.com/transfer/${toWallet}?amount=${toNano(
        amount
    )}&text=${comment}`;
}
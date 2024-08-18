# tg-payment-bot

Telegram Bot 支付机器人

## Features

- [x] Interact with BOT
- [x] Stars payment
- [x] TON payment

### 初始化

在使用测试环境进行机器人开发时，创建 Bot 实例，需要将`environment`指定为`test`，否则将会产生`401 Unauthorized`错误。

另外如果当前的网络环境需要使用科学上网才能访问 Telegram，还需要配置`baseFetchConfig.agent`为你的代理地址。

```javascript title="Bot Init"
new Bot(process.env.BOT_TOKEN!, {
    client: {
        baseFetchConfig: {
            // highlight-next-line
            agent: isDevEnv ? new HttpsProxyAgent('http://127.0.0.1:7890') : null
        },
        // highlight-next-line
        environment: isDevEnv ? 'test' : 'prod'
    }
})
```

### Stars 支付流程

```javascript title="Pay With Stars"
// highlight-next-line
// 1. 调用 `sendInvoice` 发送发票，currency 参数指定为`XTR`
ctx.api.sendInvoice(ctx.chat!.id, 'Title', 'Description', `payload`, 'XTR', [{ label: 'Label', amount: 1 }])

// highlight-next-line
// 2. 检查发票，等待字段 `pre_checkout_query` 的更新
bot.on('pre_checkout_query', (ctx) => {

// highlight-next-line
// 3. 通过 `answerPreCheckoutQuery` 批准或取消订单
    ctx.answerPreCheckoutQuery(true)
    // ctx.answerPreCheckoutQuery(false, {
    //     error_message: 'An unexpected error occurred. Please try again later.'
    // })
})

// highlight-next-line
// 4. 等待字段 `successful_payment` 的更新
bot.on(':successful_payment', ctx => {

// highlight-next-line
// 5. 支付成功回调，存储成功支付的 `telegram_payment_charge_id`（未来可能需要用它来发起退款）
    console.log(ctx.message?.successful_payment.telegram_payment_charge_id)

// highlight-next-line
// 6. 向用户交付其所购买的商品和服务，业务逻辑...
    ctx.reply('payment-success').catch(console.error)
})
```

### TON 支付流程

1. 生成指定钱包的支付链接

```javascript
function generatePaymentLink(
  toWallet: string,
  amount: number | string | bigint,
  comment: string,
  app: "tonhub" | "tonkeeper"
) {
  if (app === "tonhub") {
    return `https://tonhub.com/transfer/${toWallet}?amount=${toNano(
      amount
    )}&text=${comment}`;
  }

  return `https://app.tonkeeper.com/transfer/${toWallet}?amount=${toNano(
    amount
  )}&text=${comment}`;
}
```

2. 将生成的链接以菜单形式返回给用户，并提供`check_transaction`事件用于检查交易

```javascript
const tonhubPaymentLink = generatePaymentLink(process.env.OWNER_WALLET!, amount, comment, 'tonhub')
const tonkeeperPaymentLink = generatePaymentLink(process.env.OWNER_WALLET!, amount, comment, 'tonkeeper')

const menu = new InlineKeyboard()
    .url("Click to pay in TonHub", tonhubPaymentLink)
    .row()
    .url("Click to pay in TonKeeper", tonkeeperPaymentLink)
    .row()
    .text(`I sent ${amount} TON`, "check_transaction");

await ctx.reply(
    `Tips`,
    { reply_markup: menu, parse_mode: "HTML" }
);
```

3. 监听`check_transaction`事件，校验支付状态，处理支付成功的逻辑

```javascript
bot.callbackQuery("check_transaction", checkTransaction);

async function checkTransaction(ctx) {
  await verifyTransactionExistance(
    process.env.OWNER_WALLET,
    ctx.session.amount,
    ctx.session.comment
  );
}

async function verifyTransactionExistance(
  toWallet: Address,
  value: number,
  comment: string
) {
  const endpoint =
    process.env.NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC";

  const httpClient = new HttpApi(endpoint, {
    apiKey: process.env.TONCENTER_TOKEN,
  });

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
    let txComment = tx.in_msg.message;
    if (txComment === comment && txValue === value.toString()) {
      return true;
    }
  }

  return false;
}
```

## 注意事项

- **测试环境账号注册**

  在 Telegram 的账号体系中，测试环境与主环境完全隔离，因此在进行测试环境登录时，无法直接使用现有账号进行登录，在扫码时会提示`AUTH_TOKEN_INVALID2`错误，以及无法收到验证码的情况。
  所以你需要先注册一个测试账号，截止 2024 年 8 月，测试账号只能通过 iPhone 端 Telegram 进行。具体操作流程如下：

  > 1、登录 Telegram iPhone
  > 2、多次点击右下角`Setting`Tab 进入 Debug 页面
  > 3、点击操作列表中的`Accounts`项
  > 4、点击`Login to another account`选择`Test`环境，完成账号注册

  账号注册完成后，就可以按官方流程进入测试环境。在使用测试环境时，您可以采用未加密的 HTTP 链接来测试您的 Web 应用或 Web 登录功能。

  另外测试环境的 Telegram Star 也需要进行购买，不过可以参考下文使用 stripe 提供的测试信用卡无限制进行购买。

- **信用卡测试支付**

  在您的机器人支付功能仍在开发和测试阶段时，请使用 **“Stripe 测试模式”** 提供商。在此模式下，您可以进行支付操作而不会实际计费任何账户。测试模式中无法使用真实信用卡，但您可以使用测试卡，如 `4242 4242 4242 4242` [(完整测试卡列表)](https://docs.stripe.com/testing#cards)。您可以随意在测试模式与实时模式间切换，但在正式上线前，请务必查阅[上线检查清单](https://core.telegram.org/bots/payments#going-live)。c

## Reference

- [grammY 框架](https://grammy.dev/zh/guide/)

  grammY 是一个用于创建 Telegram Bot 的框架。它可以从 TypeScript 和 JavaScript 中使用，在 Node.js、 Deno 和浏览器中运行。

- [Bot Payments API for Digital Goods and Services](https://core.telegram.org/bots/payments-stars)

  用于数字商品和服务的机器人支付 API

- [How to integrate Telegram Stars Payment to your bot](https://teletype.in/@alteregor/how-to-integrate-telegram-stars)

  如何将 Telegram Stars 支付集成到您的机器人中

- [测试环境账号注册](https://medium.com/@Asher_Tan/telegram-test-server%E8%B4%A6%E5%8F%B7%E6%B3%A8%E5%86%8C-24b0d424a2ff)

- [TON Faucet 水龙头](https://faucet.tonfura.com/)

- [官方 Demo 出售饺子的机器人](https://docs.ton.org/mandarin/develop/dapps/tutorials/accept-payments-in-a-telegram-bot-js)

- [本文项目 Demo 地址](https://github.com/Dnevend/tg-payment-bot)


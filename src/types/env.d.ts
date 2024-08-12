// env.d.ts
declare namespace NodeJS {
    export interface ProcessEnv {
        ENV: 'dev' | 'prod'
        NETWORK: 'mainnet' | 'testnet'
        BOT_TOKEN: string
        TONCENTER_TOKEN: string
        OWNER_WALLET: string
    }
}

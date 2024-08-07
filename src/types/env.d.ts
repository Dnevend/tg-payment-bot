// env.d.ts
declare namespace NodeJS {
    export interface ProcessEnv {
        ENV: 'dev' | 'prod'
        BOT_TOKEN: string
    }
}

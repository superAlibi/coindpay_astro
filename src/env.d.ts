interface ImportMetaEnv {
  readonly DENO_KV_ACCESS_TOKEN: string;

  readonly COINDPAY_API_BASE_URL: string;
  readonly COINDPAY_API_SECRET: string;
  readonly COINDPAY_PAYMENT_LINK: string;

  readonly THAILAND_API_BASE_URL: string;
  readonly THAILAND_API_SECRET: string;
  readonly THAILAND_API_CHANNEL_ID: string;
  readonly THAILAND_API_APP_ID: string;
  readonly THAILAND_API_MERCHANT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
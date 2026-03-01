import ky from 'ky'
import { createHmac } from 'node:crypto'
import process from 'node:process'
import { z } from 'zod/v4'

export const APIS = {
  /**
   * 获得支付信息详情
   */
  paymentInfo: "api/payment/payee",
  /**
   * 获得订单信息详情
   */
  orderInfo: 'api/payment/order',

}


function getApiBaseUrl(): string | undefined {
  return process.env.COINDPAY_API_BASE_URL
}

export const kyClient = ky.create({
  prefixUrl: getApiBaseUrl(),
})

export interface STDResponse<T> {
  ok: boolean;
  /**
   * 返回数据,在请求成功时会返回
   */
  data?: T;
  /**
   * 错误信息,在请求异常时会返回
   */
  message?: string
}
/* 
订单详细信息
*/
export interface OrderInfo {
  /** 唯一支付订单 Id */
  id: string;
  /** 商品或服务 Id */
  payeeId: string;
  /** 收款方内部 UUID（通常对应 appid） */
  uuid: string;
  /** 商户应用 Id */
  appid: string;
  /** 付款人姓名（可选） */
  name?: string;
  /** 付款人邮箱 */
  email: string;
  /** 付款备注信息（可选） */
  message?: string;
  /** 付款人钱包地址（或链上账户） */
  payer: string;
  /** 法币支付方式（如 card / apple / google，可选） */
  payMethod?: string;
  /** 第三方 Ramps 服务提供的订单号（可选） */
  rampId?: string;
  /** Ramps 支付类型（pay / buy / sell，可选） */
  rampType?: string;
  /** Ramps 订单状态 */
  rampStatus: string;
  /** 法币币种（如 USD、AED，可选） */
  fiatCoin?: string;
  /** 法币金额（可选） */
  fiatAmount?: number;
  /** 区块链名称（例如 solana、ethereum、BASE 等） */
  chain: string;
  /** 代币符号（如 USDC、USDT、ETH 等） */
  symbol: string;
  /** 代币合约地址（可选） */
  contract?: string;
  /** 结算 Token 数量（税后必填） */
  amount: number;
  /** 结算 Token 数量（税费与预留金后，可选） */
  afterReserveAmount?: number;
  /** 支付时对应的美元价值 */
  usd: number;
  /** 支付完成后的唯一链上签名 / 哈希 */
  signature: string;
  /** 区块链结算交易哈希（可选） */
  settledTx?: string;
  /** 订单结算时间 */
  settledAt: string;
  /** 订单创建时间 */
  createdAt: string;
  /** 订单更新时间 */
  updatedAt: string;
}

type PayType = 'fiat' | 'crypto'
type ChargeType = 1 | 2
type SubscribeType = 'monthly' | 'weekly'
type Chain = 'solana' | 'ethereum' | 'base'
/**
 * 支付链接的详情
 */
export interface PaymentInfo {
  /** 支付链接的唯一标识符 */
  id: string;
  /** 关联的用户 UUID */
  uuid: string;
  /** 支付链接标题 */
  title: string;
  /** 支付链接描述（可选） */
  desc?: string;
  /** 固定支付金额，当 amountType = 1 时使用（可选） */
  price?: number;
  /**
   * 金额类型：
   * 1 = 固定金额
   * 2 = 可变金额（用户可输入金额，最高不超过 maxAmount）
   */
  amountType: number;
  /** 使用可变金额时的最高金额限制，最大 50000（可选） */
  maxAmount?: number;
  /**
   * 支付方式（多选，必填）
   * 例如: "fiat"（法币）、"crypto"（加密货币）
   */
  payType: PayType[];
  /**
   * 计费类型（默认 1）：
   * 1 = 单次支付（一次性收费）
   * 2 = 订阅（持续性收费）
   */
  chargeType: ChargeType;
  /**
   * 订阅类型（仅在 chargeType = 2 时生效，可选，默认 "monthly"）：
   * "monthly" = 按月订阅
   * "weekly" = 按周订阅
   */
  subscribeType?: SubscribeType;
  /**
   * 支持的链列表（可选），例如 "solana"、"ethereum"
   * svm：不包含 chainId
   * evm：包含 chainId
   */
  chains?: Chain[];
  /** 法币代币符号或标识（例如 "USDC"，可选） */
  fiatToken?: string;
  /** 用于展示的封面图片列表（可选） */
  images?: string[];
  /**
   * 主题 / 样式编号（必填）
   * 可选值：0 / 1 / 2 / 3 / 4 / 5
   */
  theme: number;
  /** 自定义品牌 Logo 及相关版权信息（可选） */
  copyright?: {
    /** 品牌 Logo 的 URL */
    logo: string;
  };
  /**
   * 状态（默认 1）：
   * 1 = 在线
   * -1 = 下线
   * 0 = 已删除
   */
  status: number;
  /** 创建时间，ISO 8601 时间戳 */
  createdAt: string;
  /** 最近一次更新时间，ISO 8601 时间戳（可选） */
  updatedAt?: string;
};
/**
 * 获得支付信息详情
 * @param id 
 * @returns 
 */
export const getPaymentInfo = async (id: string) => {
  const response = await kyClient.get(APIS.paymentInfo, { searchParams: { id } });
  return response.json<STDResponse<PaymentInfo>>();
}
/**
 * 获得订单信息详情
 * @param rampId 
 * @returns 
 */
export const getOrderInfo = async (rampId: string) => {
  const response = await kyClient.get(APIS.orderInfo, { searchParams: { rampId } });
  return response.json<STDResponse<OrderInfo>>();
}

export interface CoindPayUrlParams {
  /** Required. 唯一订单 ID */
  merchant_transaction_id: string;

  /** 价格签名，price 存在时必填（HMAC-SHA256 Hex） */
  signature?: string;

  /** 商品 / 支付标题 */
  title?: string;

  /** 商品 / 服务简介 */
  desc?: string;

  /** 支付金额（字符串形式，如 "19.99"） */
  price?: string | number;

  /** 货币代码，如 "USD" / "EUR" */
  currency?: string;

  /** 展示图片数组 */
  images?: { url: string }[];

  /** 预填客户姓名 */
  name?: string;

  /** 预填客户邮箱 */
  email?: string;

  /** 默认支付方式，如 "card" / "apple" / "google" 等 */
  payment_method?: string;

  /** 是否锁定支付方式 */
  fix_payment_method?: boolean;

  /** 是否启用自动弹出的小部件模式 */
  embed_widget?: boolean;

  /** 完成后的前端跳转地址 */
  redirect_url?: string;
}

/** 当 price 存在时，signature 和 merchant_transaction_id 必填 */
const CoindPayUrlParamsSchema = z
  .object({
    merchant_transaction_id: z.string(),
    signature: z.string().optional(),
    title: z.string().optional(),
    desc: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    images: z.array(z.object({ url: z.string() })).optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    payment_method: z.string().optional(),
    fix_payment_method: z.boolean().optional(),
    embed_widget: z.boolean().optional(),
    redirect_url: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasPrice = data.price !== undefined && data.price !== null && data.price > 0;
      if (!hasPrice) return true;
      return (
        typeof data.signature === 'string' &&
        data.signature.length > 0 &&
        typeof data.merchant_transaction_id === 'string' &&
        data.merchant_transaction_id.length > 0
      );
    },
    { message: '当 price 存在时，signature 和 merchant_transaction_id 为必填参数' }
  );

export type CoindPayUrlParamsValidated = z.infer<typeof CoindPayUrlParamsSchema>;


export type PaymentsLinkSigPayload = Pick<z.infer<typeof CoindPayUrlParamsSchema>, 'merchant_transaction_id' | 'price'>

export function createHmacSignature(secret: string, bodyString: string): string {
  return createHmac('sha256', secret).update(bodyString).digest('hex')
}

export function canonicalizeSigPath(payload: PaymentsLinkSigPayload): string {
  return `merchant_transaction_id=${payload?.merchant_transaction_id}&price=${payload?.price}`
}

// Merchant payment link signature（If price is included in the URL）
// secretKey: The merchant/developer’s API Secret from the dashboard integration hooks.
export function signPaymentsLinkSig(payload: PaymentsLinkSigPayload, secretKey: string): string {
  const canonical = canonicalizeSigPath(payload)
  return createHmacSignature(secretKey, canonical)
}


/**
 * 传入支付链接和查询参数，返回拼接后的支付链接。
 * 当 queryData 中含有 price 时，必须同时提供 signature 和 merchant_transaction_id，否则抛出 ZodError。
 * @param link
 * @param queryData
 * @returns 拼接后的完整支付链接 URL
 */
export async function getEncodePayLink(
  link: string,
  queryData?: CoindPayUrlParams
): Promise<string> {
  const { success, data: validated, error } = await CoindPayUrlParamsSchema.safeParseAsync(queryData)
  if (!success) {
    const erorMessage = error.issues.map((issue) => issue.message).join(',');
    console.error(erorMessage);
    throw new Error(erorMessage);
  }
  const url = new URL(link);

  Object.entries(validated).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(
      key,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
  });

  return url.toString();
}


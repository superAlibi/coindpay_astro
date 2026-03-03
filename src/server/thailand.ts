import { createHash } from "node:crypto";
import dayjs from "dayjs";
import ky from 'ky'
import { z } from 'zod/v4'
import { env } from "../tools/index.ts";


const APIS = {
  createCollectingOrder: 'api/createCollectingOrder',
}
const kyClient = ky.create({
  prefixUrl: env('THAILAND_API_BASE_URL'),
})

/**
 * 返回状态码 code 值字典
 * @see http://sandbox.bossbia.xyz:3031/status-code.html#%E8%BF%94%E5%9B%9E%E7%8A%B6%E6%80%81%E7%A0%81code%E5%80%BC%E5%AD%97%E5%85%B8
 */
export type StatusCode =
  | '0'    // 调用正常
  | '1'    // 技术错误，需要技术人员解决
  | '501'  // ip not allow access
  | '502'  // no merchant exists
  | '503'  // no payment channel exists
  | '504'  // insufficient balance
  | '505'  // amount Not within the limit range
  | '506'  // the amount format is incorrect
  | '507'  // service lost
  | '508'  // server ip no allow access
  | '509'  // app not exists
  | '510'  // wallet not exists
  | '511'  // bank not found
  | '601'  // signature verification failed
  | '602'  // order create fail
  | '800'; // params validation failed

/** 状态码与描述映射（便于错误提示） */
export const STATUS_CODE_MESSAGES: Record<StatusCode, string> = {
  0: "调用正常",
  1: "技术错误，需要技术人员解决",
  501: "ip not allow access",
  502: "no merchant exists",
  503: "no payment channel exists",
  504: "insufficient balance",
  505: "amount Not within the limit range",
  506: "the amount format is incorrect",
  507: "service lost",
  508: "server ip no allow access",
  509: "app not exists",
  510: "wallet not exists",
  511: "bank not found",
  601: "signature verification failed",
  602: "order create fail",
  800: "params validation failed",
};

/**
 * MD5 32位加密
 * @param {string} message 待加密字符串
 * @returns {string} 32位小写MD5字符串
 */
export function md5(message: string): string {
  return createHash("md5",).update(message).digest("hex");
}




/**
 * 代收接口(收银台形式) - 创建订单请求参数
 * @see http://sandbox.bossbia.xyz:3031/collecting-create.html
 */
export interface CreateCollectingOrderParams {
  /** 商户ID，uuid，由我方提供 */
  merchantId: string;
  /** 支付方式，uuid，由我方提供 */
  channelId: string;
  /** 商户唯一订单ID，每次提交不可重复，建议使用 guid/uuid 或时间戳+随机数，最大长度32，通知时会原样返回 */
  merchantUniqueOrderId: string;
  /** 商户应用 id */
  appId: string;
  /** 玩家标识，用于区分玩家，如玩家ID、玩家账号 md5、下游商户ID 等 */
  playerSign: string;
  /** 订单金额，THB 泰铢，整数 */
  amount: string;
  /** 支付结果异步通知地址，支付完成后服务器会向此地址发送结果 */
  notifyUrl: string;
  /** 商户自定义备注，可传空字符串 */
  remark: string;
  /** 签名结果，将参与验签的字段按签名规则计算出的 MD5 值（32位小写） */
  sign: string;
  /** 手机号，不参与验签 */
  playerMobile: string;
  /** 银行名称，不参与验签 */
  bankNameCreate: string;
  /** 银行卡号，不参与验签 */
  bankNumberCreate: string;
  /** 户名，不参与验签 */
  nameCreate: string;
}

/** 代收接口创建订单响应的 data 字段 */
export interface CreateCollectingOrderData {
  /** 支付订单 ID */
  payOrderId: string;
  /** 商户唯一订单 ID */
  merchantUniqueOrderId: string;
  /** 收银台/支付链接 */
  url: string;
  /** 订单金额 */
  amount: string;
  /** 实际到账金额 */
  realAmount: string;
  /** 玩家手机号 */
  playerMobile: string;
}

/** 代收接口(收银台形式) - 创建订单响应 */
export interface STDResponse<T> {
  code: StatusCode;
  msg: string;
  data: T;
}
/**
 * 客户端请求参数校验 schema
 */
export const CreateCollectingOrderParamsSchema = z.object({

  merchantUniqueOrderId: z.string(),
  /**
   * 玩家标识，用于区分玩家，如玩家ID、玩家账号 md5、下游商户ID 等。
   * 该值可以是 'no-callback'，或者其他字符串
   */
  playerSign: z.string(),

  /** 金额，字符串格式但必须是有效数字（可含小数） */
  amount: z
    .string()
    .refine((val) => val.trim() !== '' && !Number.isNaN(Number(val)) && Number.isFinite(Number(val)), {
      message: 'amount 必须是有效的数字字符串',
    }),
  notifyUrl: z.string(),
  remark: z.string(),


  playerMobile: z.string(),
  bankNameCreate: z.string(),
  bankNumberCreate: z.string(),
  nameCreate: z.string(),
})


/**
 * 客户端请求参数校验类型
 */
export type CreateCollectingOrderParamsValidated = z.infer<typeof CreateCollectingOrderParamsSchema>;
/**
 * 发往泰国支付的请求参数 schema
 */
export const CreateCollectingOrderParamsWithEnvSchema = CreateCollectingOrderParamsSchema.extend({
  merchantId: z.string(),
  channelId: z.string(),
  appId: z.string(),
  sign: z.string(),
})

/**
 * 发往泰国支付的请求参数类型
 */
export type CreateCollectingOrderParamsWithEnv = z.infer<typeof CreateCollectingOrderParamsWithEnvSchema>;

/**
 * 请求泰国支付代收接口
 * @param params 请求参数
 * @returns 响应数据，包含支付订单 ID、商户唯一订单 ID、收银台/支付链接、订单金额、实际到账金额、玩家手机号
 */
export async function createCollectingOrder(params: CreateCollectingOrderParamsValidated) {

  const { merchantUniqueOrderId, playerSign, amount, notifyUrl, remark, ...ops } = params;
  const md5Key = env('THAILAND_API_SECRET');
  const channelId = env('THAILAND_API_CHANNEL_ID');
  const appId = env('THAILAND_API_APP_ID');
  const merchantId = env('THAILAND_API_MERCHANT_ID');
  const obj = {
    merchantUniqueOrderId,
    playerSign,
    amount,
    notifyUrl,
    remark,
    channelId,
    appId,
    merchantId
  }
  /**
   * 拼接md5签名需要的参数
   */
  const paramsString = Object.entries(obj).map(([key, value]) => {
    return `${key}=${value}`
  }).join('&');
  /**
   * 生成签名
   */
  const sign = md5(`${paramsString}${md5Key}`);
  /**
   * 校验发往泰国支付的请求参数
   */
  const { success: successWithEnv, data: validatedWithEnv, error: errorWithEnv } = CreateCollectingOrderParamsWithEnvSchema.safeParse({
    ...obj,
    ...ops,
    sign,
  });
  if (!successWithEnv) {
    throw new Error(errorWithEnv.issues.map((issue) => issue.message).join(','));
  }
  const postBody: CreateCollectingOrderParamsWithEnv = {
    ...validatedWithEnv,
  }
  const response = await kyClient.post(APIS.createCollectingOrder, {
    json: postBody
  }).json<STDResponse<CreateCollectingOrderData>>();
  return response;

}

/**
 * 代收回调通知 - 平台 POST 到商户 notifyUrl 的 body
 * @see http://sandbox.bossbia.xyz:3031/collecting-notify.html
 */
export interface CollectingNotifyPayload {
  merchantId: string;
  merchantUniqueOrderId: string;
  payOrderId: string;
  amount: string;
  transferAmount: string;
  realAmount: string;
  /** "1" 成功 "0" 失败 */
  payOrderStatus: string;
  remark: string;
  /** 格式 yyyy-MM-dd HH:mm:ss */
  finishTime: string;
  sign: string;
  channelCost?: number;
}

/** 将 finishTime "yyyy-MM-dd HH:mm:ss" 转为签名用 "yyyyMMddHHmmss" */
export function finishTimeToSignFormat(finishTime: string): string {
  if (!finishTime || typeof finishTime !== "string") return "";
  const d = dayjs(finishTime, "YYYY-MM-DD HH:mm:ss");
  return d.isValid() ? d.format("YYYYMMDDHHmmss") : "";
}

/**
 * 代收回调验签：参与签名的字段（含空值）按文档顺序拼接后接 Md5Key 再 MD5 32 位小写
 * 签名字段顺序：merchantId, merchantUniqueOrderId, payOrderId, amount, transferAmount, realAmount, payOrderStatus, remark, finishTime（紧凑格式）
 */
export function verifyCollectingNotifySign(
  payload: CollectingNotifyPayload,
  md5Key: string
): boolean {
  const finishTimeCompact = finishTimeToSignFormat(payload.finishTime);
  const str =
    `merchantId=${payload.merchantId}` +
    `&merchantUniqueOrderId=${payload.merchantUniqueOrderId}` +
    `&payOrderId=${payload.payOrderId}` +
    `&amount=${payload.amount}` +
    `&transferAmount=${payload.transferAmount}` +
    `&realAmount=${payload.realAmount}` +
    `&payOrderStatus=${payload.payOrderStatus}` +
    `&remark=${payload.remark}` +
    `&finishTime=${finishTimeCompact}` +
    md5Key;
  const expected = md5(str);
  return expected === payload.sign;
}
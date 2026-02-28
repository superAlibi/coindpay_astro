import ky from "ky";

export const APIS = {
  paymentInfo: 'api/payment/payee',

}
export const kyClient = ky.create({
  prefixUrl: Deno.env.get("COINDPAY_API_BASE_URL")
});


/** CoindPay API 类型定义 */

/** 链信息 */
export interface Chain {
  name: string;
  id: number;
}

/** Payee 数据 */
export interface PayeeData {
  id: string;
  createdAt: string;
  updatedAt: string;
  uuid: string;
  title: string;
  desc: string;
  images: string[] | null;
  price: number;
  usdPegged: boolean;
  amountType: number;
  payType: ("fiat" | "crypto")[];
  payoutType: string | null;
  fiatToken: string | null;
  bankCurrency: string | null;
  chargeType: number;
  subscribeType: number | null;
  maxAmount: number | null;
  currencies: string[];
  chains: Chain[];
  theme: number;
  copyright: string | null;
  status: number;
}

/** API 响应 */
export interface STDResponse<T> {
  ok: boolean;
  data: T;
}

export async function getPaymentInfo(id: string): Promise<STDResponse<PayeeData>> {
  const response = await kyClient.get("api/payment/payee", { searchParams: { id } });
  return response.json<STDResponse<PayeeData>>();
}

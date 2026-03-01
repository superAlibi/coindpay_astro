import "@std/dotenv/load";
import { assertExists, assertEquals, assert } from "@std/assert";
import { getPaymentInfo, getEncodePayLink, signPaymentsLinkSig } from "../server/apis.ts";
import { HTTPError } from "ky";
import type { STDResponse, PaymentInfo } from "../server/apis.ts";

// const paymentLink = 'https://coindpay.xyz/pay/link/wWN8qCUfS3KiDLNTWEmrA'
const paymentLink = 'https://coindpay.xyz/pay/link/x_25lmobuZhWcSz7uw4Bm'
Deno.test("test coindpay api", async (ctx) => {
  await ctx.step('get env COINDPAY_API_BASE_URL', async () => {
    const COINDPAY_API_BASE_URL = Deno.env.get("COINDPAY_API_BASE_URL");
    assertExists(COINDPAY_API_BASE_URL, 'COINDPAY_API_BASE_URL is not set');
    console.log(COINDPAY_API_BASE_URL);
  });
  await ctx.step('get api key', async () => {
    const apiKey = Deno.env.get("COINDPAY_API_SECRET");
    assertExists(apiKey, 'COINDPAY_API_SECRET is not set');
  });

  await ctx.step('gen payment link', async () => {
    const signaturePayload = {
      merchant_transaction_id: crypto.randomUUID(),
      price: 60.00,
    }
    const signature = signPaymentsLinkSig(signaturePayload, Deno.env.get("COINDPAY_API_SECRET"));
    const response = await getEncodePayLink(paymentLink, {
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
      signature,
      ...signaturePayload,
    });
    // 用 std assert 判断结果为有效 URL
    const isValidUrl = (s: string) => { try { new URL(s); return true; } catch { return false; } };
    assert(isValidUrl(response), `Expected valid URL, got: ${response}`);
  });

  await ctx.step('gen payment link without price', async () => {
    const signaturePayload = {
      merchant_transaction_id: crypto.randomUUID(),
    }
    const signature = signPaymentsLinkSig(signaturePayload, Deno.env.get("COINDPAY_API_SECRET"));
    const response = await getEncodePayLink(paymentLink, {
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
      signature,
      ...signaturePayload,
    });
    // 用 std assert 判断结果为有效 URL
    const isValidUrl = (s: string) => { try { new URL(s); return true; } catch { return false; } };
    assert(isValidUrl(response), `Expected valid URL, got: ${response}`);
  });
  await ctx.step('gen payment link without price and no signature', async () => {
    const signaturePayload = {
      merchant_transaction_id: crypto.randomUUID(),
    }
    // const signature = signPaymentsLinkSig(signaturePayload, Deno.env.get("COINDPAY_API_SECRET"));
    const response = await getEncodePayLink(paymentLink, {
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
      // signature,
      ...signaturePayload,
    });
    // 用 std assert 判断结果为有效 URL
    const isValidUrl = (s: string) => { try { new URL(s); return true; } catch { return false; } };
    assert(isValidUrl(response), `Expected valid URL, got: ${response}`);
  });
  await ctx.step('gen payment link with price but without signature', async () => {
    const signaturePayload = {
      merchant_transaction_id: crypto.randomUUID(),
      price: 60.00,
    }
    // const signature = signPaymentsLinkSig(signaturePayload, Deno.env.get("COINDPAY_API_SECRET"));
    await getEncodePayLink(paymentLink, {
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
      // signature,
      ...signaturePayload,
    }).catch((error) => {
      assertEquals(error.message, '当 price 存在时，signature 和 merchant_transaction_id 为必填参数');
    }).then(() => {
      throw new Error('Expected error');
    });
    // 用 std assert 判断结果为有效 URL
  });
  await ctx.step('get api response', async () => {
    const response = await getPaymentInfo('wWN8qCUfS3KiDLNTWEmrA');
    assertExists(response.data, 'response.data is not set');
    assertEquals(response.data.id, 'wWN8qCUfS3KiDLNTWEmrA', 'response.data.id is not wWN8qCUfS3KiDLNTWEmrA');
    assertEquals(response.ok, true, 'response.ok is not true');
  });
  // 测试一个错误的请求id, 应该返回错误信息
  await ctx.step('get api response with invalid id', async () => {
    await getPaymentInfo('invalid-id').catch(async (error: HTTPError) => {
      const jsonResult = await error.response.json();
      assertEquals((jsonResult as STDResponse<PaymentInfo>).ok, false, '(jsonResult as STDResponse<PaymentInfo>).ok is not false');
      assertEquals(error.response.ok, false, 'error.response.ok is not false');
      assertEquals(error.response.status, 404, 'error.response.status is not 404');
    });
  });
});
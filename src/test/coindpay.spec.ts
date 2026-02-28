import "@std/dotenv/load";
import { assertExists, assertEquals } from "@std/assert";
import { getPaymentInfo, getEncodePayLink, signPaymentsLinkSig } from "../server/apis.ts";

// const paymentLink = 'https://coindpay.xyz/pay/link/wWN8qCUfS3KiDLNTWEmrA'
const paymentLink = 'https://coindpay.xyz/pay/link/x_25lmobuZhWcSz7uw4Bm'
Deno.test("test coindpay api", async (ctx) => {
  await ctx.step('get env COINDPAY_API_BASE_URL', async () => {
    const COINDPAY_API_BASE_URL = Deno.env.get("COINDPAY_API_BASE_URL");
    assertExists(COINDPAY_API_BASE_URL);
    console.log(COINDPAY_API_BASE_URL);
  });
  await ctx.step('get api key', async () => {
    const apiKey = Deno.env.get("COINDPAY_API_SECRET");
    assertExists(apiKey);
  });
  /* await ctx.step('get api response', async () => {
    const response = await getPaymentInfo('wWN8qCUfS3KiDLNTWEmrA');
    assertExists(response.data);
    assertEquals(response.data.id, 'wWN8qCUfS3KiDLNTWEmrA');
    assertEquals(response.ok, true);
  }); */

  await ctx.step('gen payment link', async () => {
    const signaturePayload = {
      merchant_transaction_id: crypto.randomUUID(),
      price: '60.00',
    }
    const signature = signPaymentsLinkSig(signaturePayload, Deno.env.get("COINDPAY_API_SECRET"));
    const response = getEncodePayLink(paymentLink, {
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name:'布鲁斯',
      email:'bruce@gmail.com',
      signature,
      ...signaturePayload, 
    });
    console.log(response);
    /* assertExists(response.data);
    assertEquals(response.data.id, 'wWN8qCUfS3KiDLNTWEmrA');
    assertEquals(response.ok, true); */
  });
});
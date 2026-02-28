import "@std/dotenv/load";
import { assertExists, assertEquals } from "@std/assert";
import { getPaymentInfo, kyClient } from "../server/apis.ts";

Deno.test("test coindpay api", async (ctx) => {
  await ctx.step('get env', async () => {
    const env = Deno.env.get("COINDPAY_API_BASE_URL");
    assertExists(env);
  });
  await ctx.step('get api key', async () => {
    const apiKey = Deno.env.get("COINDPAY_API_SECRET");
    assertExists(apiKey);
  });
  await ctx.step('get api response', async () => {
    // https://coindpay.xyz/pay/link/wWN8qCUfS3KiDLNTWEmrA
    const response = await getPaymentInfo('wWN8qCUfS3KiDLNTWEmrA');
    assertExists(response.data);
    assertEquals(response.data.id, 'wWN8qCUfS3KiDLNTWEmrA');
    assertEquals(response.ok, true);
  });
});
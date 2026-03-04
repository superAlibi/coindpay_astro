import { describe, it, expect } from 'vitest';
import {
  createCollectingOrder,
  verifyCollectingNotifySign,
  finishTimeToSignFormat,
  md5,
  type CreateCollectingOrderParamsValidated,
} from '../server/thailand.ts';
import { env } from '../tools/index.ts';

describe('createCollectingOrder（集成：真实请求泰国支付）', () => {
  it('需要配置泰国支付相关环境变量', () => {
    expect(env('THAILAND_API_BASE_URL'), '未配置 THAILAND_API_BASE_URL 环境变量').toBeDefined();
    expect(env('THAILAND_API_SECRET'), '未配置 THAILAND_API_SECRET 环境变量').toBeDefined();
    expect(env('THAILAND_API_CHANNEL_ID'), '未配置 THAILAND_API_CHANNEL_ID 环境变量').toBeDefined();
    expect(env('THAILAND_API_APP_ID'), '未配置 THAILAND_API_APP_ID 环境变量').toBeDefined();
    expect(env('THAILAND_API_MERCHANT_ID'), '未配置 THAILAND_API_MERCHANT_ID 环境变量').toBeDefined();
  });

  it('能成功调用 createCollectingOrder 并拿到收银台链接', async () => {
    const params: CreateCollectingOrderParamsValidated = {
      merchantUniqueOrderId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      playerSign: 'no-callback',
      amount: '100',
      notifyUrl: 'https://example.com/notify',
      remark: 'integration test',
      playerMobile: '0812345678',
      bankNameCreate: 'Bangkok Bank',
      bankNumberCreate: '1234567890',
      nameCreate: 'Test User',
    };

    const result = await createCollectingOrder(params);

    expect(result).toBeDefined();
    expect(result.code).toBe('0');
    expect(result.data).toBeDefined();
    expect(result.data!.payOrderId).toBeDefined();
    expect(result.data!.merchantUniqueOrderId).toBe(params.merchantUniqueOrderId);
    expect(result.data!.url).toBeDefined();
    expect(result.data!.amount).toBe(params.amount);
    expect(result.data!.playerMobile).toBe(params.playerMobile);
  }, 15000);
});

describe('代收回调验签', () => {
  it('finishTimeToSignFormat 将 yyyy-MM-dd HH:mm:ss 转为 yyyyMMddHHmmss', () => {
    expect(finishTimeToSignFormat('2025-04-16 11:14:06')).toBe('20250416111406');
    expect(finishTimeToSignFormat('')).toBe('');
  });

  it('验签通过：文档示例 sign 与本地计算一致', () => {
    const payload = {
      merchantId: 'abcdefghijklmnopqrstuvwxyz123456',
      merchantUniqueOrderId: 'merchantUniqueOrderId',
      payOrderId: 'abcdefghijklmnopqrstuvwxyz123456',
      amount: '10000',
      transferAmount: '10000',
      realAmount: '10000',
      payOrderStatus: '1',
      remark: 'mark',
      finishTime: '2025-04-16 11:14:06',
      sign: '', // 下面用正确 key 算出后填入
    };
    const md5Key = 'mkkkkkkkkkk';
    // 文档示例：MD5("merchantId=...&...&finishTime=20250416111406mkkkkkkkkkk") 等于 sign
    const str =
      'merchantId=abcdefghijklmnopqrstuvwxyz123456' +
      '&merchantUniqueOrderId=merchantUniqueOrderId' +
      '&payOrderId=abcdefghijklmnopqrstuvwxyz123456' +
      '&amount=10000&transferAmount=10000&realAmount=10000' +
      '&payOrderStatus=1&remark=mark&finishTime=20250416111406' +
      md5Key;
    const expectedSign = md5(str);
    payload.sign = expectedSign;
    expect(verifyCollectingNotifySign(payload, md5Key)).toBe(true);
  });

  it('验签失败：sign 被篡改', () => {
    const payload = {
      merchantId: 'm',
      merchantUniqueOrderId: 'oid',
      payOrderId: 'pid',
      amount: '100',
      transferAmount: '100',
      realAmount: '100',
      payOrderStatus: '1',
      remark: '',
      finishTime: '2025-04-16 11:14:06',
      sign: 'wrong-sign',
    };
    expect(verifyCollectingNotifySign(payload, 'key')).toBe(false);
  });
});

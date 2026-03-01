import { describe, it, expect } from 'vitest';
import { getPaymentInfo, getEncodePayLink } from '../server/apis.ts';
import { HTTPError } from 'ky';
import type { STDResponse, PaymentInfo } from '../server/apis.ts';

const paymentLink = 'https://coindpay.xyz/pay/link/x_25lmobuZhWcSz7uw4Bm';

describe('coindpay api', () => {
  it('get env COINDPAY_API_BASE_URL', () => {
    const COINDPAY_API_BASE_URL = process.env.COINDPAY_API_BASE_URL;
    expect(COINDPAY_API_BASE_URL).toBeDefined();
    expect(COINDPAY_API_BASE_URL).toBeTruthy();
  });

  it('get api key', () => {
    const apiKey = process.env.COINDPAY_API_SECRET;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
  });

  it('gen payment link', async () => {
    const response = await getEncodePayLink(paymentLink, {
      merchant_transaction_id: crypto.randomUUID(),
      price: 60.0,
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
    });
    const isValidUrl = (s: string) => {
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    };
    expect(isValidUrl(response)).toBe(true);
    expect(response).toContain('signature=');
  });

  it('gen payment link without price', async () => {
    const response = await getEncodePayLink(paymentLink, {
      merchant_transaction_id: crypto.randomUUID(),
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
    });
    const isValidUrl = (s: string) => {
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    };
    expect(isValidUrl(response)).toBe(true);
  });

  it('gen payment link without price and no signature', async () => {
    const response = await getEncodePayLink(paymentLink, {
      merchant_transaction_id: crypto.randomUUID(),
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
    });
    const isValidUrl = (s: string) => {
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    };
    expect(isValidUrl(response)).toBe(true);
  });

  it('gen payment link with price but without signature', async () => {
    const response = await getEncodePayLink(paymentLink, {
      merchant_transaction_id: crypto.randomUUID(),
      price: 60.0,
      title: '嘻嘻不嘻嘻',
      desc: '不嘻嘻',
      name: '布鲁斯',
      email: 'bruce@gmail.com',
    });
    expect(response).toContain('signature=');
    expect(response).toContain('price=60');
  });

  it('get api response', async () => {
    const response = await getPaymentInfo('wWN8qCUfS3KiDLNTWEmrA');
    expect(response.data).toBeDefined();
    expect(response.data!.id).toBe('wWN8qCUfS3KiDLNTWEmrA');
    expect(response.ok).toBe(true);
  });

  it('get api response with invalid id', async () => {
    try {
      await getPaymentInfo('invalid-id');
      expect.fail('Expected getPaymentInfo to throw');
    } catch (error) {
      const httpError = error as HTTPError;
      const jsonResult = await httpError.response.json();
      expect((jsonResult as STDResponse<PaymentInfo>).ok).toBe(false);
      expect(httpError.response.ok).toBe(false);
      expect(httpError.response.status).toBe(404);
    }
  });
});

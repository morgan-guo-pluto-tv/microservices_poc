import { init, set, close, request } from 'service-common';
import { Request, Response } from '../../src';
import { RequestSubject } from '../../src';
import { serviceName, serviceImplementation } from '../../src/adRequester';
import 'dotenv/config';

describe('test stub for app', () => {
    beforeAll(async () => {
        await init(process.env.NATS_SERVER_URL as string, serviceName);
        await set(RequestSubject.GetAds, serviceImplementation);
    });

    afterAll(close);
    test('basic message interactions', async () => {
        const res = await request<Response, Request>(RequestSubject.GetAds, {
            headers: { 'user-agent': 'chrome', 'x-request-id': '123' },
            params: {
                ipAddress: '192.168.0.1',
                context: 'sample context',
                transactionId: 'sample_transaction_id'
            },
            url: 'sample.url'
        });
        expect(res).toBeDefined();
        expect(res.length <= 20).toBe(true);
        console.log(res);
    }, 10000);
});

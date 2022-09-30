import { init, set, close, request } from 'service-common';
import { Response } from '../../src';
import { RequestSubject } from '../../src/enums/enums';
import {
    serviceName,
    serviceImplementation
} from '../../src/services/adRequester';
import 'dotenv/config';

describe('test stub for app', () => {
    beforeAll(async () => {
        await init(process.env.NATS_SERVER_URL as string, serviceName);
        await set(RequestSubject.GetAds, serviceImplementation);
    });

    afterAll(close);
    test('basic message interactions', async () => {
        const res = (await request(RequestSubject.GetAds, 'test')) as Response;
        expect(res).toBeDefined();
        expect(res.ads).toBeDefined();
        expect(res.ads.length <= 20).toBe(true);
    }, 10000);
});

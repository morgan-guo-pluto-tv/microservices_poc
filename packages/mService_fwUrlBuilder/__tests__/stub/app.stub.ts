import 'dotenv/config';
import { init, set, close, request } from 'service-common';
import { Response } from '../../src';
import { RequestSubject } from '../../src/enums/enums';
import {
    serviceName,
    serviceImplementation
} from '../../src/services/fwUrlBuilder';

describe('test stub for app', () => {
    beforeAll(async () => {
        await init(process.env.NATS_SERVER_URL as string, serviceName);
        await set(RequestSubject.ComposeFreewheelURL, serviceImplementation);
    });

    afterAll(close);
    test('basic message interactions', async () => {
        const res = (await request(RequestSubject.ComposeFreewheelURL, {
            params: [1, 2, 3]
        })) as Response;
        expect(res).toBeDefined();
        expect(res.fwURl).toBeDefined();
        expect(typeof res.fwURl).toBe('string');
    }, 10000);
});

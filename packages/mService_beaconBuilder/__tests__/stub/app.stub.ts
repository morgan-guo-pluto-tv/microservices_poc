import 'dotenv/config';
import { init, set, close, request } from 'service-common';
import { Response } from '../../src';
import { RequestSubject } from '../../src/enums/enums';
import {
    serviceName,
    serviceImplementation
} from '../../src/services/beaconBuilder';

describe('test stub for app', () => {
    beforeAll(async () => {
        await init(process.env.NATS_SERVER_URL as string, serviceName);
        await set(RequestSubject.ComposeBeacon, serviceImplementation);
    });

    afterAll(close);
    test('basic message interactions', async () => {
        const res = (await request(
            RequestSubject.ComposeBeacon,
            'test'
        )) as Response;
        expect(res).toBeDefined();
        expect(Array.isArray(res)).toBe(true);
    }, 10000);
});

import 'dotenv/config';
import { init, set } from 'service-common';
import { RequestSubject } from './enums';
import { serviceImplementation, serviceName } from './adRequester';

(async () => {
    await init(process.env.NATS_SERVER_URL as string, serviceName);
    await set(RequestSubject.GetAds, serviceImplementation);
})();

import 'dotenv/config';
import { initializeRequestReplyPattern as init } from 'enterprise_service_bus';
import { RequestSubject } from './enums/enums';
import { serviceImplementation, serviceName } from './services/fwUrlBuilder';

Promise.resolve(
    init(
        process.env.NATS_SERVER_URL as string,
        serviceName,
        RequestSubject.ComposeFreewheelURL,
        serviceImplementation
    )
);

export default { name: serviceName, RequestSubject };
export { Request, Response } from './services/fwUrlBuilder';

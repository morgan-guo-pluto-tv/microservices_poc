import 'dotenv/config';
import express from 'express';
import { init } from 'service-common';
import { implementation } from './get-image';

const SERVICE_NAME = 'Pause Ad';

(async () => {
    await init(process.env.NATS_SERVER_URL as string, SERVICE_NAME);

    const app = express();

    app.get('/image', implementation);

    const port = 3000;
    app.listen(port, () => {
        console.log(
            `${SERVICE_NAME} µService is running like a champion! Listening in the port ${port}`
        );
    });
})();

import 'dotenv/config';
import express from 'express';
import { init, JSONValue, request } from 'service-common';

const SERVICE_NAME = 'Pause Ad';

(async () => {
    await init(process.env.NATS_SERVER_URL as string, SERVICE_NAME);

    const app = express();

    app.get('/image', async (req, res) => {
        // Getting the Fw URL
        const { fwURl } = (await request('COMPOSE_FW_URL', {
            params: [1, 2, 3]
        })) as { fwURl: string };

        // Getting Ads
        const { ads } = (await request('GET_ADS', fwURl)) as {
            ads: JSONValue[];
        };

        // Getting beacons for each ad in the list
        res.send(
            await Promise.all(ads.map((ad) => request('COMPOSE_BEACON', ad)))
        );
    });

    const port = 3000;
    app.listen(port, () => {
        console.log(
            `${SERVICE_NAME} µService is running like a champion! Listening in the port ${port}`
        );
    });
})();

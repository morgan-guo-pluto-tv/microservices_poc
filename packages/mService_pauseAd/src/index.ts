import express from "express";
import 'dotenv/config';
import { AdRequesterRequest, AdRequesterResponse, FwURlRequest, ExecutionEvent } from "../../data_model/build";
import { FwUrlResponse } from "../../data_model/build";
import { MessagingService } from "enterprise_service_bus";
import { BeaconRequest } from "../../data_model/build";



const SERVICE_NAME = "Pause Ad";
MessagingService.init(process.env.NATS_SERVER_URL as string, SERVICE_NAME)
    .then(() => {
        const app = express();

        app.get("/image", async function (req, res) {

            await MessagingService.publishEvent(SERVICE_NAME, new ExecutionEvent({ serviceName: '/image' }));

            // Getting the Fw URL
            const fwUrlResponse = await MessagingService.request(SERVICE_NAME, new FwURlRequest({ params: [1, 2, 3] })) as FwUrlResponse;

            // Getting Ads
            const adRequesterResponse = await MessagingService.request(SERVICE_NAME, new AdRequesterRequest( {urlRequest: fwUrlResponse.payload.fwURl })) as AdRequesterResponse;
            

            // Getting beacons for each ad in the list
            const getBeaconPromises = adRequesterResponse.payload.ads.map(ad => MessagingService.request(SERVICE_NAME, new BeaconRequest({ ad })));

            Promise.all(getBeaconPromises).then((results) => {
                res.send(results.map(ad => ({ extendedAd: ad.payload, statusCode: ad.statusCode})));
            });

        });


        const port = 3000;
        app.listen(port, async () => {
            console.log(`${SERVICE_NAME} µService is running like a champion! Listening in the port ${port}`);
            
        });

    });




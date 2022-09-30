import { JSONValue, request } from 'service-common';
import { Request as Req, Response as Res } from 'express';

export type Response = string[][];

export async function implementation(_: Req, res: Res<Response>) {
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
        (await Promise.all(
            ads.map((ad) => request('COMPOSE_BEACON', ad))
        )) as Response
    );
}

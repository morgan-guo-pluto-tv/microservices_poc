import { JSONValue } from 'enterprise_service_bus';
import { replaceAllMacro } from './macro';
import axios from 'axios';
import res from './sample-res.json';
import { Vmap, Creative as VmapCreative } from './vmap';

const INSTANCE_ID = `adreq_${process.env.INSTANCE_NAME}_${Math.floor(
    Math.random() * 100
)}`;

type MediaFile = {
    url: string;
    height: number;
    width: number;
    type: string;
};

type Creative = {
    origin: Partial<MediaFile>;
    id: string;
};

export type Response = {
    adID?: string;
    title?: string;
    source: string;
    creatives: Creative[];
    impressions: string[];
}[];

export type Request = {
    headers: Record<string, string>;
    params: Record<string, string>;
    url: string;
};

const TIMEOUT_IN_MS = process.env.FW_VAST_TIMEOUT
    ? Number.parseInt(process.env.FW_VAST_TIMEOUT)
    : 2000; //2000ms;

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

/**
 * Converts bypassed timeout parameter to ISO string.
 * If timeout is missing, uses passed default timeout value.
 */
export function timeoutToISOString(reference: number): string {
    // Hacky detect if number was UNIX timestamp or timeout
    // I hope no one needs timeouts larger than 1 day for requests :)
    const timeout =
        reference < DAY_IN_MILLISECONDS ? reference + Date.now() : reference;

    // Finally create ISO string
    return new Date(timeout).toISOString();
}

function withoutUndefined(obj: Exclude<JSONValue, null>): JSONValue {
    switch (typeof obj) {
        case 'object':
            return Array.isArray(obj)
                ? obj.map(withoutUndefined)
                : Object.fromEntries(
                      Object.entries(obj).filter(
                          (pair) => pair[1] !== undefined
                      )
                  );
        default:
            return obj;
    }
}

const withPartialMediaFiles = ({
    url,
    height,
    width,
    type
}: Partial<MediaFile>) => ({
    url,
    height,
    width,
    type
});

const AD_REQUESTER_URL = process.env.AD_REQUESTER_URL;

async function implementation(req: JSONValue): Promise<Response> {
    const {
        headers: { 'user-agent': userAgent, 'x-request-id': xRequestId },
        params: { ipAddress: clientIP, context, transactionId: transaction_id },
        url
    } = req as Request;
    try {
        await axios.get(`${AD_REQUESTER_URL}/v1/vmap`, {
            timeout: TIMEOUT_IN_MS,
            params: withoutUndefined({
                url: replaceAllMacro(url),
                neededBy: new Date(Date.now() + TIMEOUT_IN_MS).toISOString(),
                userAgent,
                clientIP,
                transaction_id,
                context: context || xRequestId
            })
        });
    } catch (e) {
        console.error(e);
    }

    const vmap: Vmap = await res;
    const adSource = vmap?.adBreaks?.[0]?.adSource;
    if (!adSource) return [];

    const [{ id: adID, title, impressions, creatives, mediaFiles }] = vmap
        ?.vastAdSources?.[adSource]?.ads ?? [{}];

    return withoutUndefined([
        {
            adID,
            title,
            source: 'fw',
            creatives: creatives.map((c: VmapCreative) => ({
                id: c.id,
                origin: withPartialMediaFiles(mediaFiles[c.id]?.[0] ?? {})
            })),
            impressions
        }
    ]);
}

export const serviceImplementation = implementation;

export { INSTANCE_ID as serviceName };

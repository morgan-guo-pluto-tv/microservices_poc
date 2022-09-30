/* (c) 2021 Pluto Inc. */

import { URL } from 'url';

const UMS_MACRO_REPLACE = /(\${puid}|\[puid]|%7bpuid%7d|{puid})/gi;

type Last<T extends any[]> = T extends [...infer I, infer L] ? L : never;

type Init<T extends any[]> = T extends [...infer I, infer L] ? I : never;

type Head<T extends any[]> = T extends [infer H, ...infer T] ? H : never;

type Tail<A extends any[]> = A extends [infer H, ...infer T] ? T : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MethodAny = (...args: any) => any;

type Method<Args extends any[], R> = (...args: Args) => R;

type Composition<F1 extends MethodAny, F2 extends MethodAny> = [
    ReturnType<F2>
] extends Parameters<F1>
    ? Method<Parameters<F2>, ReturnType<F1>>
    : never;

type SequentialComposition<Fs extends MethodAny[]> = Fs extends [
    infer F1 extends MethodAny,
    infer F2 extends MethodAny
]
    ? Composition<F2, F1>
    : Fs extends [
          infer FF extends MethodAny,
          ...infer FRest extends MethodAny[]
      ]
    ? Composition<SequentialComposition<FRest>, FF>
    : never;

function seq<F extends MethodAny, Fs extends MethodAny[]>(
    f: F,
    ...fs: Fs
): SequentialComposition<[F, ...Fs]> {
    return ((...args: unknown[]) =>
        fs.reduce((r, fr) => fr(r), f(...args))) as SequentialComposition<
        [F, ...Fs]
    >;
}

/**
 * Perform Google PAL, User Mapping (Cookie Sync) and Roku GOOGLE_MARCO replacement
 * @param url - Tag to process
 * @param pluto - Request object
 * @param sequence - Ad sequence index
 * @param logger - Request logger
 * @param mappingConfig - Mapping from settings
 */

// AdProxy has following check for sequence
// if (!_.isUndefined(sequence)) {
//     replacedTag = replaceRokuMacrosInFW(replacedTag, sequence);
// }
// We are doing the same here, because DFP or VMAP may not pass sequence at all
// src/lib/adhttp.js line 52
// src/lib/adBucket/adCollector.js line 84
// src/lib/adRequester/adRequester.js line 66
export const replaceAllMacro = seq(
    replaceRokuMacrosInFW,
    replaceSpacesInURL,
    replaceGooglePALMacro,
    exceptionalize(
        'User Mapping replace UMS GOOGLE_MARCO fail',
        replaceUMSMacro
    )
);

/** This function is to replace correlator and ppos in the Roku tags returned by FreeWheel. */
function replaceRokuMacrosInFW(url: string, index?: number | string): string {
    // TODO: Find out if 0 is also bad value
    return index === undefined
        ? url
        : url.replace(/\[POD_POSITION]/g, `${index}`);
}

/**
 * Replace all spaces in url
 * @param url
 */
function replaceSpacesInURL(url: string): string {
    if (url.includes(' ')) {
        console.warn('found space in tag', { tag: url });
        return url.replace(/ /g, '');
    }
    return url;
}

const googlePal = process.env.GOOGLE_PAL;

const GOOGLE_MARCO = /\${GOOGLE_PAL_NONCE}/g;

/**
 * This function replaces single encounter of [GOOGLE_PAL_NONCE]
 * GOOGLE_MARCO with paln value from request
 * if there are no paln param in request, it replace paln= param in URL with empty string.
 * @param url - VAST URL with GOOGLE_MARCO
 */
function replaceGooglePALMacro(url: string): string {
    if (!url.includes('${GOOGLE_PAL_NONCE}')) return url;

    if (googlePal) {
        // renamed from "paln"
        console.info('Google PAL Macro replaced', { url });
        return url.replace(GOOGLE_MARCO, encodeURIComponent(googlePal));
    }
    console.info('Google PAL Macro removed', { url });
    return url.replace(GOOGLE_MARCO, '');
}

type UserMappingServiceConfig = {
    // url: string;
    // timeout: number;
    isEnabled: boolean;
    // username: string;
    // password: string;
    // enabledDeviceTypes: string[];
};

const umsConfig: UserMappingServiceConfig = {
    isEnabled: true
};

// WARN: Check if RegExps should be /g to replace all macros
type UserMappingID = {
    // pid: string;
    puid: string;
    domains: string[];
};

type UserMappingResponse = {
    // uid: string;
    ids: UserMappingID[];
};

const userMappingService: UserMappingResponse = {
    ids: []
};

function exceptionalize<F extends MethodAny>(msg: string, f: F): F {
    return ((...args) => {
        try {
            return f(...args);
        } catch (error) {
            console.info(msg, {
                error
            });
        }
    }) as F;
}

/**
 * Replace user mapping GOOGLE_MARCO in the url
 * @param url
 */
function replaceUMSMacro(url: string): string {
    if (!UMS_MACRO_REPLACE.test(url)) return url;

    const ums = userMappingService;

    if (!umsConfig) console.error('User mapping service config are empty');

    // if UMS GOOGLE_MARCO not enabled, skip it
    // if we do not have mappings just skip it

    if (umsConfig?.isEnabled && ums?.ids?.length !== 0) {
        // try to find mapping for current adtag request
        const { hostname } = new URL(url);
        const found = ums.ids.find((id) =>
            id.domains.some((domain) => hostname.endsWith(domain))
        );

        // if we have valid value for replacement
        if (found?.puid) {
            const replaced = url.replace(
                UMS_MACRO_REPLACE,
                encodeURI(found.puid)
            );
            console.info(
                'Successfully replaced UMS GOOGLE_MARCO to value from mapping storage',
                { url: replaced }
            );

            return replaced;
        }
    }

    return removeUMS(url);
}

function removeUMS(urlToReplace: string): string {
    const replaced = urlToReplace.replace(UMS_MACRO_REPLACE, '');
    console.info('Successfully removed UMS GOOGLE_MARCO from requested URL', {
        url: replaced
    });
    return replaced;
}

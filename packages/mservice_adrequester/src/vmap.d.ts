type File = {
    bitrate: number;
    inPoint: number;
    outPoint: number;
    url: string;
    height: number;
    width: number;
    type: string;
    duration: number;
};
export type AdSource = {
    version: number;
    ads: Ad[];
};

export type Creative = {
    id: string;
    duration: number;
};

export type Ad = {
    id: string;
    title: string;
    impressions: string[];
    creatives: Creative[];
    mediaFiles: Record<string, File[]>;
};

export type AdBreak = {
    id: string;
    type: string;
    adSource: string;
};

export type Vmap = {
    adBreaks: AdBreak[];
    vastAdSources: Record<string, AdSource>;
};

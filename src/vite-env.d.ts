/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_UMAMI_SCRIPT_URL?: string;
    readonly VITE_UMAMI_WEBSITE_ID?: string;
}

interface Window {
    umami?: {
        identify(id: string, data?: Record<string, unknown>): void;
        track(event?: string, data?: Record<string, unknown>): void;
    };
    __umamiIdentityReady?: boolean;
    __UMAMI_CONFIG__?: { scriptUrl?: string; websiteId?: string };
    __pcb?: import("./lib/pcb-background/dev-types").PcbDevApi;
}

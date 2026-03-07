/// <reference types="vite/client" />

interface Window {
    umami?: {
        identify(id: string, data?: Record<string, unknown>): void;
        track(event: string, data?: Record<string, unknown>): void;
    };
}

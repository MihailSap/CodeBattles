/// <reference types="vite/client" />

import 'react';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Error {
    status?: number;
    code?: string;
    raw?: unknown;
  }
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

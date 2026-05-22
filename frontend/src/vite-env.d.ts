/// <reference types="vite/client" />

import 'react';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  type LegacyValue = ReturnType<typeof JSON.parse>;

  interface Error {
    status?: LegacyValue;
    code?: LegacyValue;
    raw?: LegacyValue;
  }
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

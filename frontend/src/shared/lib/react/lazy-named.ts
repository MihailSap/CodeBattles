import { lazy } from 'react';
import type { ComponentType } from 'react';

export const lazyNamed = <TModule extends Record<string, unknown>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey
) =>
  lazy(async () => {
    const module = await loader();

    return {
      default: module[exportName] as ComponentType<Record<string, unknown>>,
    };
  });

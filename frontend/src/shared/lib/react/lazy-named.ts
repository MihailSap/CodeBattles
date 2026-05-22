import { lazy } from 'react';

export const lazyNamed = (loader: LegacyValue, exportName: LegacyValue) =>
  lazy(() =>
    loader().then((module: LegacyValue) => ({
      default: module[exportName],
    }))
  );

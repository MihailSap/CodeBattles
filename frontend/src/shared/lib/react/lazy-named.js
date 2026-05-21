import { lazy } from 'react';
export const lazyNamed = (loader, exportName) =>
  lazy(() =>
    loader().then((module) => ({
      default: module[exportName],
    }))
  );

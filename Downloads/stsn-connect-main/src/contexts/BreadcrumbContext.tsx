/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from "react";

export interface BreadcrumbCrumb {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbContextValue {
  crumbs: BreadcrumbCrumb[];
  setCrumbs: (crumbs: BreadcrumbCrumb[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  crumbs: [],
  setCrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbsState] = useState<BreadcrumbCrumb[]>([]);

  const setCrumbs = useCallback((next: BreadcrumbCrumb[]) => {
    setCrumbsState(next);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

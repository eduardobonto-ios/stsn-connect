/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useBreadcrumbContext, type BreadcrumbCrumb } from "../contexts/BreadcrumbContext";

/**
 * Sets the page-level breadcrumb trail for the current view.
 * Resets to [] on unmount.
 *
 * @example
 * useBreadcrumb([
 *   { label: "HR Management" },
 *   { label: "Leave Management", onClick: () => setSubPage("leave-management") },
 *   { label: "Juan Dela Cruz — LR-2026-0042" },
 * ]);
 */
export function useBreadcrumb(crumbs: BreadcrumbCrumb[]) {
  const { setCrumbs } = useBreadcrumbContext();

  useEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(crumbs)]);
}

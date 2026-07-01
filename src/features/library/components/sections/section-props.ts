/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LibraryData } from "../../data/useLibraryData";
import type { STSNModule } from "../../../../config/permissions.config";
import type { SecurityAction } from "../../../../types/security-permissions.types";
import type { LibrarySubPage } from "../../types";

export type CanPage = (module: STSNModule, page: string, action: SecurityAction) => boolean;

export interface LibrarySectionProps {
  lib: LibraryData;
  canPage: CanPage;
}

export interface LibraryDashboardProps {
  lib: LibraryData;
  onNavigate: (page: LibrarySubPage) => void;
}

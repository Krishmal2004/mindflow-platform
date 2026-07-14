import type { ReactNode } from 'react';
import { LeavesDecoration } from './Illustrations';

/**
 * Wraps every page. On mobile (<640px) it's a no-op passthrough — pages keep
 * rendering full-bleed exactly as before. On tablet/desktop it centers the
 * page's own phone-proportioned column inside an ambient gradient backdrop
 * (matching mobile's dashboard gradient) with LeavesDecoration in the
 * corners and a card shadow, so the extra space reads as designed rather
 * than as empty margin around a shrunk phone screen.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mf-shell">
      <div className="mf-shell-backdrop" aria-hidden="true">
        <div className="mf-shell-leaves mf-shell-leaves-tr">
          <LeavesDecoration width={420} height={420} />
        </div>
        <div className="mf-shell-leaves mf-shell-leaves-bl">
          <LeavesDecoration width={420} height={420} />
        </div>
      </div>
      <div className="mf-shell-card">{children}</div>
    </div>
  );
}

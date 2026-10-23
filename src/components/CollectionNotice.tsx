import React from 'react';
import { useVisitor } from '../state/VisitorProvider';

/**
 * The short notice at the point of collection (GDPR Art. 13): what this form keeps, why, and
 * where the full notice is. `children` says what this particular form keeps.
 */
export const CollectionNotice = ({ children }: { children: React.ReactNode }) => {
  const { actions } = useVisitor();
  return (
    <p className="text-[13px] leading-relaxed text-slate-400">
      {children} Stored in Google Firebase, never sold, and you can delete it any time under Privacy &amp; my data.{' '}
      <button type="button" onClick={() => actions.openSheet('privacy')} className="font-semibold text-slate-200 underline underline-offset-4 hover:text-white">
        Privacy notice
      </button>
    </p>
  );
};

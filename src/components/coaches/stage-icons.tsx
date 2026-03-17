'use client';

import type { POHStage } from '@/types';

interface StageIconProps {
  className?: string;
}

/** Train pulling into depot — Intake */
function IntakeIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Train body */}
      <rect x="4" y="4" width="16" height="12" rx="2" />
      {/* Window */}
      <rect x="7" y="7" width="4" height="4" rx="0.5" />
      <rect x="13" y="7" width="4" height="4" rx="0.5" />
      {/* Wheels */}
      <circle cx="8" cy="19" r="1.5" />
      <circle cx="16" cy="19" r="1.5" />
      {/* Rail */}
      <line x1="2" y1="21" x2="22" y2="21" />
      {/* Arrow down into depot */}
      <line x1="12" y1="1" x2="12" y2="3" strokeWidth="1.5" />
    </svg>
  );
}

/** Wrench unscrewing — Dismantling */
function DismantlingIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Wrench */}
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/** Magnifying glass with eye — Inspection */
function InspectionIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
      {/* Eye inside magnifier */}
      <path d="M8 11c0-1.5 1.3-3 3-3s3 1.5 3 3-1.3 3-3 3-3-1.5-3-3z" strokeWidth="1.2" />
      <circle cx="11" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Gear with wrench — Overhaul */
function OverhaulIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Gear */}
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" strokeWidth="0" />
      <path d="M14.3 8l1.4-2.4M9.7 8L8.3 5.6M8 12H5.2M9.7 16l-1.4 2.4M14.3 16l1.4 2.4M16 12h2.8" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="5" fill="none" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" fill="none" strokeWidth="1.8" />
    </svg>
  );
}

/** Puzzle pieces / building blocks — Reassembly */
function ReassemblyIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Bottom block */}
      <rect x="3" y="13" width="8" height="8" rx="1" />
      {/* Top-right block */}
      <rect x="13" y="3" width="8" height="8" rx="1" />
      {/* Connector piece */}
      <path d="M11 17h2v-4h4v-2h-4V7h-2v4H7v2h4v4z" fill="currentColor" stroke="none" opacity="0.3" />
      {/* Arrow suggesting assembly */}
      <path d="M17 13v3h-3" />
      <path d="M7 11V8h3" />
    </svg>
  );
}

/** Paint brush — Finishing */
function FinishingIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Brush head */}
      <path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4 7.37-7.37z" />
      {/* Handle */}
      <path d="M11 14l-2.5 2.5" />
      {/* Paint drip */}
      <path d="M8.5 16.5C7 18 4 21 4 21s0-3 1.5-4.5" />
      {/* Sparkle */}
      <path d="M19 14v3M17.5 15.5h3" strokeWidth="1.5" />
    </svg>
  );
}

/** Speedometer gauge — Testing */
function TestingIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Gauge arc */}
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />
      {/* Gauge marks */}
      <path d="M12 5v2M5.6 8.4l1.4 1.4M4 15h2M18 15h2M17 8.4l-1.4 1.4" strokeWidth="1.5" />
      {/* Needle */}
      <path d="M12 15l3.5-5.5" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Train on track — Trial run */
function TrialIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Train front */}
      <path d="M8 5h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      {/* Headlight */}
      <circle cx="12" cy="8" r="1.5" />
      {/* Window */}
      <rect x="9" y="11" width="6" height="3" rx="0.5" />
      {/* Wheels */}
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
      {/* Track */}
      <line x1="2" y1="21" x2="22" y2="21" />
      {/* Speed lines */}
      <line x1="1" y1="8" x2="4" y2="8" strokeWidth="1.2" opacity="0.5" />
      <line x1="1" y1="11" x2="3" y2="11" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

/** Checkered flag / departure — Release */
function ReleaseIcon({ className = 'h-5 w-5' }: StageIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Flag pole */}
      <line x1="5" y1="4" x2="5" y2="21" />
      {/* Flag */}
      <path d="M5 4h14l-3 4 3 4H5" />
      {/* Checkered pattern on flag */}
      <rect x="7" y="5" width="3" height="3" fill="currentColor" opacity="0.2" stroke="none" />
      <rect x="13" y="5" width="3" height="3" fill="currentColor" opacity="0.2" stroke="none" />
      <rect x="10" y="8" width="3" height="3" fill="currentColor" opacity="0.2" stroke="none" />
    </svg>
  );
}

/** Map stage name to its icon component */
const STAGE_ICON_MAP: Record<POHStage, React.FC<StageIconProps>> = {
  Intake: IntakeIcon,
  Dismantling: DismantlingIcon,
  Inspection: InspectionIcon,
  Overhaul: OverhaulIcon,
  Reassembly: ReassemblyIcon,
  Finishing: FinishingIcon,
  Testing: TestingIcon,
  Trial: TrialIcon,
  Release: ReleaseIcon,
};

export function StageIcon({ stage, className }: { stage: POHStage; className?: string }) {
  const Icon = STAGE_ICON_MAP[stage];
  return <Icon className={className} />;
}

'use client';

interface PartIconProps {
  className?: string;
}

/** Motorized wheel assembly — Motor Bogie */
function MotorBogieIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Frame */}
      <rect x="2" y="8" width="20" height="5" rx="1.5" />
      {/* Wheels */}
      <circle cx="7" cy="18" r="3" />
      <circle cx="17" cy="18" r="3" />
      {/* Axle connections */}
      <line x1="7" y1="13" x2="7" y2="15" />
      <line x1="17" y1="13" x2="17" y2="15" />
      {/* Motor symbol on frame */}
      <path d="M10 9.5h4M10 11.5h4" strokeWidth="1.2" />
      {/* Lightning bolt for motor */}
      <path d="M12 5l-1 2h2l-1 2" strokeWidth="1.5" />
    </svg>
  );
}

/** Wheel frame without motor — Trailer Bogie */
function TrailerBogieIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Frame */}
      <rect x="2" y="8" width="20" height="5" rx="1.5" />
      {/* Wheels */}
      <circle cx="7" cy="18" r="3" />
      <circle cx="17" cy="18" r="3" />
      {/* Axle connections */}
      <line x1="7" y1="13" x2="7" y2="15" />
      <line x1="17" y1="13" x2="17" y2="15" />
      {/* Cross-brace on frame */}
      <line x1="9" y1="9" x2="15" y2="12" strokeWidth="1" />
      <line x1="15" y1="9" x2="9" y2="12" strokeWidth="1" />
    </svg>
  );
}

/** Motor coil — Traction Motor */
function TractionMotorIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Motor housing */}
      <rect x="4" y="6" width="16" height="12" rx="3" />
      {/* Shaft */}
      <line x1="20" y1="12" x2="23" y2="12" strokeWidth="2.5" />
      {/* Coil windings */}
      <path d="M8 9c2 0 2 2 4 2s2-2 4-2" />
      <path d="M8 12c2 0 2 2 4 2s2-2 4-2" />
      <path d="M8 15c2 0 2-2 4-2s2 2 4 2" strokeWidth="1" opacity="0.5" />
      {/* Terminal */}
      <circle cx="4" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="15" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Brake disc with caliper — Brake System */
function BrakeSystemIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Brake disc */}
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      {/* Disc ventilation slots */}
      <line x1="12" y1="5" x2="12" y2="8" strokeWidth="1.2" />
      <line x1="17.5" y1="8.5" x2="15.4" y2="9.8" strokeWidth="1.2" />
      <line x1="17.5" y1="15.5" x2="15.4" y2="14.2" strokeWidth="1.2" />
      <line x1="12" y1="19" x2="12" y2="16" strokeWidth="1.2" />
      <line x1="6.5" y1="15.5" x2="8.6" y2="14.2" strokeWidth="1.2" />
      <line x1="6.5" y1="8.5" x2="8.6" y2="9.8" strokeWidth="1.2" />
      {/* Center hub */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3" stroke="none" />
    </svg>
  );
}

/** Lightning bolt with circuit — Electrical System */
function ElectricalSystemIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Lightning bolt */}
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

/** Diamond pantograph shape — Pantograph */
function PantographIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Overhead wire */}
      <line x1="3" y1="3" x2="21" y2="3" strokeWidth="2" />
      {/* Contact strip */}
      <rect x="8" y="4" width="8" height="1.5" rx="0.5" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Upper arms (diamond) */}
      <line x1="12" y1="5.5" x2="7" y2="12" />
      <line x1="12" y1="5.5" x2="17" y2="12" />
      {/* Lower arms */}
      <line x1="7" y1="12" x2="12" y2="18" />
      <line x1="17" y1="12" x2="12" y2="18" />
      {/* Base mount */}
      <rect x="9" y="18" width="6" height="3" rx="1" />
      {/* Roof line */}
      <line x1="5" y1="21" x2="19" y2="21" />
    </svg>
  );
}

/** Chain links — Couplers */
function CouplersIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Left link */}
      <rect x="2" y="8" width="9" height="8" rx="4" />
      {/* Right link */}
      <rect x="13" y="8" width="9" height="8" rx="4" />
      {/* Overlap area */}
      <line x1="11" y1="10" x2="13" y2="10" strokeWidth="2" />
      <line x1="11" y1="14" x2="13" y2="14" strokeWidth="2" />
    </svg>
  );
}

/** Coil spring — Suspension System */
function SuspensionSystemIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Top plate */}
      <line x1="6" y1="3" x2="18" y2="3" strokeWidth="2" />
      {/* Spring coils */}
      <path d="M8 3L16 6.5" />
      <path d="M16 6.5L8 10" />
      <path d="M8 10L16 13.5" />
      <path d="M16 13.5L8 17" />
      <path d="M8 17L16 20.5" />
      {/* Bottom plate */}
      <line x1="6" y1="21" x2="18" y2="21" strokeWidth="2" />
    </svg>
  );
}

/** Coach outline — Body Shell */
function BodyShellIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Coach body */}
      <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
      {/* Windows */}
      <rect x="4.5" y="8" width="3" height="3" rx="0.5" />
      <rect x="9" y="8" width="3" height="3" rx="0.5" />
      <rect x="13.5" y="8" width="3" height="3" rx="0.5" />
      {/* Door */}
      <rect x="18" y="7.5" width="2.5" height="6" rx="0.5" />
      {/* Underframe line */}
      <line x1="3" y1="17" x2="21" y2="17" strokeWidth="1" opacity="0.5" />
      {/* Wheels */}
      <circle cx="7" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  );
}

/** Map part name to its icon component */
const PART_ICON_MAP: Record<string, React.FC<PartIconProps>> = {
  'Motor Bogie': MotorBogieIcon,
  'Trailer Bogie': TrailerBogieIcon,
  'Traction Motor': TractionMotorIcon,
  'Brake System': BrakeSystemIcon,
  'Electrical System': ElectricalSystemIcon,
  'Pantograph': PantographIcon,
  'Couplers': CouplersIcon,
  'Suspension System': SuspensionSystemIcon,
  'Body Shell': BodyShellIcon,
};

/** Default fallback icon for unknown parts */
function DefaultPartIcon({ className = 'h-4 w-4' }: PartIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" strokeWidth="1.5" />
    </svg>
  );
}

export function PartIcon({ partName, className }: { partName: string; className?: string }) {
  const Icon = PART_ICON_MAP[partName] ?? DefaultPartIcon;
  return <Icon className={className} />;
}

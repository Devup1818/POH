import { Train } from 'lucide-react';

const BG_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/5/57/2016-03-26_a_MEMU_train_of_Indian_Railways.jpg';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/50 via-black/40 to-slate-900/70" />
      {/* Warm light ray from top-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.2)_0%,_transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <Train className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white drop-shadow-lg">
            Railway POH Management
          </h1>
          <p className="mt-1 text-sm text-amber-200/80">Indian Railways</p>
        </div>
        {children}
      </div>
    </div>
  );
}

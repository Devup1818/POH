import { Train } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Train className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Railway POH Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Indian Railways</p>
        </div>
        {children}
      </div>
    </div>
  );
}

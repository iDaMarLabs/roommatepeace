import { Home } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 mb-4">
            <Home size={22} className="text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Roommate Peace
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Shared home accountability
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

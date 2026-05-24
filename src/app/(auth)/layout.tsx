export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Roommate Peace</h1>
          <p className="text-stone-500 text-sm mt-1">
            Shared home accountability
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

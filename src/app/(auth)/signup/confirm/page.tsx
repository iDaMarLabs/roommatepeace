export default function ConfirmPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📬</span>
      </div>
      <h2 className="text-xl font-semibold text-stone-900 mb-2">
        Check your email
      </h2>
      <p className="text-stone-500 text-sm">
        We sent a confirmation link to your email. Click it to activate your
        account and set up your household.
      </p>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <p className="font-semibold text-slate-900">Page not found</p>
      <p className="text-sm text-slate-500">The requested university portal page does not exist.</p>
      <Link href="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </div>
  );
}

import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6 py-20">
      <div className="max-w-xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
          Error 404
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-950">
          Page not found
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          The page you requested does not exist or has been moved.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
        >
          <ArrowLeft size={18} />
          Return home
        </Link>
      </div>
    </main>
  );
}

import {
  Link,
  Outlet,
} from "react-router";

import {
  BrandLogo,
} from "../../shared/branding";

export default function AuthenticationLayout() {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_0.82fr]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <Link to="/">
          <BrandLogo inverted />
        </Link>

        <div className="my-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
            Workforce marketplace
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
            Build professional connections that move work forward.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Manage opportunities, negotiations, assignments,
            compliance, time, payments, and reputation through
            one trusted platform.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Let&apos;s WorkLynk
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-lg">
          <Link
            to="/"
            className="mb-10 inline-flex lg:hidden"
          >
            <BrandLogo />
          </Link>

          <Outlet />
        </div>
      </section>
    </main>
  );
}

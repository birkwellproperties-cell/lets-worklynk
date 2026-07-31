import {
  Menu,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  NavLink,
} from "react-router";

import {
  BrandLogo,
} from "../../shared/branding";

const navigationItems = [
  {
    label: "Platform",
    to: "/#platform",
  },
  {
    label: "For Businesses",
    to: "/#businesses",
  },
  {
    label: "For Contractors",
    to: "/#contractors",
  },
  {
    label: "How It Works",
    to: "/#how-it-works",
  },
];

function navigationClassName({
  isActive,
}) {
  return [
    "text-sm font-semibold transition",
    isActive
      ? "text-blue-600"
      : "text-slate-600 hover:text-slate-950",
  ].join(" ");
}

export default function PublicHeader() {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          to="/"
          aria-label="Let's WorkLynk home"
          onClick={closeMobileMenu}
        >
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigationItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={navigationClassName}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/sign-in"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Sign in
          </Link>

          <Link
            to="/join"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Join WorkLynk
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-label={
            mobileMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() => {
            setMobileMenuOpen((current) => !current);
          }}
        >
          {mobileMenuOpen
            ? <X size={21} />
            : <Menu size={21} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-5 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-3 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <Link
                to="/sign-in"
                onClick={closeMobileMenu}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700"
              >
                Sign in
              </Link>

              <Link
                to="/join"
                onClick={closeMobileMenu}
                className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white"
              >
                Join WorkLynk
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

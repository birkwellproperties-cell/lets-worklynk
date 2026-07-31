import {
  Link,
} from "react-router";

import {
  BrandLogo,
} from "../../shared/branding";

const footerGroups = [
  {
    title: "Platform",
    links: [
      "Marketplace",
      "Jobs",
      "Negotiations",
      "Assignments",
    ],
  },
  {
    title: "Solutions",
    links: [
      "For Businesses",
      "For Contractors",
      "Compliance",
      "Payments",
    ],
  },
  {
    title: "Company",
    links: [
      "About",
      "Contact",
      "Privacy",
      "Terms",
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link to="/">
              <BrandLogo inverted />
            </Link>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              A secure workforce marketplace where businesses
              and independent contractors connect, negotiate,
              complete work, and manage payments.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                  {group.title}
                </h2>

                <ul className="mt-5 space-y-3">
                  {group.links.map((label) => (
                    <li key={label}>
                      <a
                        href="/#"
                        className="text-sm text-slate-400 transition hover:text-white"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-7 text-sm text-slate-500">
          © {new Date().getFullYear()} Let&apos;s WorkLynk.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}

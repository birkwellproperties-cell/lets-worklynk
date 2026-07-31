import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  Search,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router";

const capabilities = [
  {
    icon: Building2,
    title: "Built for businesses",
    description:
      "Publish opportunities, review qualified professionals, negotiate terms, and manage active assignments.",
  },
  {
    icon: Users,
    title: "Owned by contractors",
    description:
      "Control your professional profile, rates, availability, proposals, contracts, and payment activity.",
  },
  {
    icon: Handshake,
    title: "Transparent negotiation",
    description:
      "Create offers and counteroffers with a permanent record of rates, reimbursements, and working terms.",
  },
];

const workflowSteps = [
  {
    icon: BriefcaseBusiness,
    title: "Post",
    description:
      "Businesses publish jobs, projects, or individual shifts.",
  },
  {
    icon: Search,
    title: "Discover",
    description:
      "Qualified contractors discover opportunities or receive invitations.",
  },
  {
    icon: Handshake,
    title: "Negotiate",
    description:
      "Both parties agree on rates, schedules, and assignment terms.",
  },
  {
    icon: CalendarCheck2,
    title: "Complete",
    description:
      "Manage assignments, scheduling, time, and deliverables.",
  },
  {
    icon: CircleDollarSign,
    title: "Pay",
    description:
      "Approve work, process payments, and maintain transaction records.",
  },
];

const trustItems = [
  "Business and contractor verification",
  "Credential and compliance tracking",
  "Immutable negotiation history",
  "Secure assignment records",
];

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.14),_transparent_34%),radial-gradient(circle_at_left,_rgba(37,99,235,0.13),_transparent_32%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <ShieldCheck size={16} />
              Trusted workforce infrastructure
            </span>

            <h1 className="mt-7 max-w-4xl text-5xl font-bold leading-[1.04] tracking-tight text-slate-950 md:text-6xl">
              Where businesses and independent contractors
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {" "}connect.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Discover opportunities, negotiate working terms,
              manage assignments, track time, and move payments
              through one secure workforce marketplace.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/join?type=client"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Find professionals
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/join?type=contractor"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Find opportunities
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2
                  size={17}
                  className="text-emerald-500"
                />
                No agency middle layer
              </span>

              <span className="inline-flex items-center gap-2">
                <CheckCircle2
                  size={17}
                  className="text-emerald-500"
                />
                Contractor-controlled rates
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10">
            <div className="rounded-[1.5rem] bg-slate-950 p-7 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-300">
                    Marketplace snapshot
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Workforce activity
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                  Live
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-bold">248</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Open opportunities
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-bold">1.8k</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Verified contractors
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl bg-white/10 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Active negotiations
                    </span>

                    <Handshake
                      size={19}
                      className="text-cyan-300"
                    />
                  </div>

                  <p className="mt-2 text-3xl font-bold">
                    72
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5">
                  <p className="text-sm font-semibold text-blue-50">
                    Marketplace workflow
                  </p>

                  <p className="mt-2 font-semibold">
                    Post → Propose → Negotiate → Assign → Pay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              One connected platform
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Marketplace infrastructure designed around
              independent working relationships.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <article
                  key={capability.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </span>

                  <h3 className="mt-5 text-xl font-bold text-slate-950">
                    {capability.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {capability.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-slate-950 py-24 text-white"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              How WorkLynk works
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From opportunity to completed payment.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="relative rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="text-xs font-bold text-cyan-300">
                    0{index + 1}
                  </span>

                  <Icon
                    size={24}
                    className="mt-5 text-white"
                  />

                  <h3 className="mt-4 text-lg font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <BadgeCheck size={27} />
            </span>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Trust, compliance, and accountability built into every engagement.
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-slate-600">
              WorkLynk provides the records and controls needed
              to support professional marketplace relationships
              without taking control of the contractor&apos;s business.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />

                <span className="font-semibold leading-6 text-slate-800">
                  {item}
                </span>
              </div>
            ))}

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <TimerReset
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <span className="font-semibold leading-6 text-slate-800">
                Complete assignment and payment history
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 to-cyan-500 px-7 py-12 text-white shadow-xl shadow-blue-600/15 sm:px-12 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Build better working relationships.
              </h2>

              <p className="mt-4 max-w-2xl text-blue-50">
                Create your organization, establish your profile,
                and enter the workforce marketplace.
              </p>
            </div>

            <Link
              to="/join"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 lg:mt-0"
            >
              Join Let&apos;s WorkLynk
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

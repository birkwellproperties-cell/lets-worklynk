import {
  Construction,
} from "lucide-react";

export default function ClientContactsPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <Construction
        size={40}
        className="mx-auto text-blue-500"
      />

      <h1 className="mt-5 text-2xl font-bold text-slate-950">
        Client contacts
      </h1>

      <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
        Manage primary, operations, procurement, billing, compliance, and scheduling contacts.
      </p>
    </section>
  );
}
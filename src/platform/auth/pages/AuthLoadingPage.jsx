import {
  LoaderCircle,
} from "lucide-react";

import {
  BrandLogo,
} from "../../../shared/branding";

export default function AuthLoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <BrandLogo />

        <LoaderCircle
          size={30}
          className="mx-auto mt-8 animate-spin text-blue-600"
        />

        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading your WorkLynk workspace…
        </p>
      </div>
    </main>
  );
}

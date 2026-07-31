import {
  LoaderCircle,
} from "lucide-react";

export default function OrganizationLoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <div className="text-center">
        <LoaderCircle
          size={30}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading organization workspace…
        </p>
      </div>
    </div>
  );
}

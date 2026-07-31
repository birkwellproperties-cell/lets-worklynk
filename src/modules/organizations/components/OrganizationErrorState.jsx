import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function OrganizationErrorState({
  error,
  onRetry,
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
      <AlertTriangle
        size={28}
        className="text-red-600"
      />

      <h2 className="mt-5 text-xl font-bold text-red-950">
        Organization workspace could not be loaded
      </h2>

      <p className="mt-3 max-w-2xl leading-7 text-red-800">
        {error?.message ||
          "An unexpected error occurred while loading organization data."}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
        >
          <RefreshCw size={17} />
          Try again
        </button>
      )}
    </div>
  );
}

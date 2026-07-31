import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../../platform/auth";

export default function SignInPage() {
  const {
    signIn,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await signIn({
        email,
        password,
      });

      const destination =
        location.state?.from
          ?.pathname || "/app";

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (signInError) {
      setError(
        signInError?.message ||
          "Unable to sign in. Verify your credentials and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        Welcome back
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        Sign in to Let&apos;s WorkLynk
      </h1>

      <p className="mt-3 text-slate-600">
        Access your organization, marketplace activity,
        assignments, and payments.
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Email address
          </span>

          <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Mail
              size={19}
              className="text-slate-400"
            />

            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={submitting}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              placeholder="name@company.com"
              className="min-h-12 w-full border-0 bg-transparent py-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Password
          </span>

          <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <LockKeyhole
              size={19}
              className="text-slate-400"
            />

            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={submitting}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              placeholder="Enter your password"
              className="min-h-12 w-full border-0 bg-transparent py-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </span>
        </label>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="inline-flex items-center gap-2 font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300"
            />
            Remember me
          </label>

          <Link
            to="/forgot-password"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        New to WorkLynk?{" "}
        <Link
          to="/join"
          className="font-bold text-blue-600 hover:text-blue-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

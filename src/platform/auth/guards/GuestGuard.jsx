import {
  Navigate,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../index";

import AuthLoadingPage from "../pages/AuthLoadingPage";

export default function GuestGuard() {
  const {
    initialized,
    loading,
    authenticated,
  } = useAuth();

  if (!initialized || loading) {
    return <AuthLoadingPage />;
  }

  if (authenticated) {
    return (
      <Navigate
        to="/app"
        replace
      />
    );
  }

  return <Outlet />;
}

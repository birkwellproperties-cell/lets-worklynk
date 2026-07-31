import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import {
  useAuth,
} from "../index";

import AccountStatusPage from "../pages/AccountStatusPage";
import AuthLoadingPage from "../pages/AuthLoadingPage";

export default function AuthGuard() {
  const {
    initialized,
    loading,
    authenticated,
    workspaceReady,
  } = useAuth();

  const location =
    useLocation();

  if (!initialized || loading) {
    return <AuthLoadingPage />;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (!workspaceReady) {
    return <AccountStatusPage />;
  }

  return <Outlet />;
}

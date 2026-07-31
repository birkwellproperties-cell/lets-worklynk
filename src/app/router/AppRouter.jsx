import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppShell from "../shell/AppShell";
import {
  AuthGuard,
  GuestGuard,
} from "../../platform/auth";

import AuthenticationLayout from "../../modules/authentication/AuthenticationLayout";
import JoinPage from "../../modules/authentication/pages/JoinPage";
import RegistrationPlaceholderPage from "../../modules/authentication/pages/RegistrationPlaceholderPage";
import SignInPage from "../../modules/authentication/pages/SignInPage";
import PublicLayout from "../../public-site/layouts/PublicLayout";
import LandingPage from "../../public-site/pages/LandingPage";
import NotFoundPage from "../../public-site/pages/NotFoundPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            index
            element={<LandingPage />}
          />
        </Route>

        <Route element={<GuestGuard />}>
          <Route element={<AuthenticationLayout />}>
            <Route
              path="sign-in"
              element={<SignInPage />}
            />

            <Route
              path="join"
              element={<JoinPage />}
            />

            <Route
              path="join/:accountType"
              element={<RegistrationPlaceholderPage />}
            />
          </Route>
        </Route>

        <Route element={<AuthGuard />}>
          <Route
            path="app"
            element={<AppShell />}
          />
        </Route>

        <Route
          path="login"
          element={
            <Navigate
              to="/sign-in"
              replace
            />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppDashboardPage from "../shell/AppDashboardPage";
import AppShell from "../shell/AppShell";

import {
  AuthGuard,
  GuestGuard,
} from "../../platform/auth";

import AuthenticationLayout from "../../modules/authentication/AuthenticationLayout";
import JoinPage from "../../modules/authentication/pages/JoinPage";
import RegistrationPlaceholderPage from "../../modules/authentication/pages/RegistrationPlaceholderPage";
import SignInPage from "../../modules/authentication/pages/SignInPage";

import {
  ClientContactsPage,
  ClientDirectoryPage,
  ClientOnboardingPage,
  ClientOverviewPage,
  ClientProfilePage,
  ClientWorkspaceLayout,
} from "../../modules/clients";
import {
  OrganizationLayout,
} from "../../modules/organizations/layouts";

import {
  OrganizationSettingsPage,
  OrganizationBillingPage,
  OrganizationBrandingPage,
  OrganizationDepartmentsPage,
  OrganizationLocationsPage,
  OrganizationMembersPage,
  OrganizationOverviewPage,
  OrganizationPlaceholderPage,
  OrganizationProfilePage,
} from "../../modules/organizations/pages";

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
          >
            <Route
              index
              element={<AppDashboardPage />}
            />

            <Route
              path="organization"
              element={<OrganizationLayout />}
            >
              <Route
                index
                element={<OrganizationOverviewPage />}
              />

              <Route
                path="profile"
                element={<OrganizationProfilePage />}
              />

              <Route
                path="locations"
                element={<OrganizationLocationsPage />}
              />

              <Route
                path="departments"
                element={<OrganizationDepartmentsPage />}
              />

              <Route
                path="branding"
                element={<OrganizationBrandingPage />}
              />

              <Route
                path="billing"
                element={<OrganizationBillingPage />}
              />

              <Route
                path="settings"
                element={<OrganizationSettingsPage />}
              />

              <Route
                path="members"
                element={<OrganizationMembersPage />}
              />
            </Route>

            <Route
              path="clients"
            >
              <Route
                index
                element={<ClientDirectoryPage />}
              />

              <Route
                path=":relationshipId"
                element={<ClientWorkspaceLayout />}
              >
                <Route
                  index
                  element={<ClientOverviewPage />}
                />

                <Route
                  path="profile"
                  element={<ClientProfilePage />}
                />

                <Route
                  path="contacts"
                  element={<ClientContactsPage />}
                />

                <Route
                  path="onboarding"
                  element={<ClientOnboardingPage />}
                />
              </Route>
            </Route>

            <Route
              path="contractors"
              element={<OrganizationPlaceholderPage />}
            />

            <Route
              path="jobs"
              element={<OrganizationPlaceholderPage />}
            />
          </Route>
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

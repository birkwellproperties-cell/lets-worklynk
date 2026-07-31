import {
  OrganizationProvider,
} from "../../modules/organizations";

import {
  AuthProvider,
} from "../../platform/auth";

import QueryProvider from "./QueryProvider";

export default function AppProviders({
  children,
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

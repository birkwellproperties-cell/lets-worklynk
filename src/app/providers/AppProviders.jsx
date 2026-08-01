import {
  ClientProvider,
} from "../../modules/clients";

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
        <ClientProvider>
          {children}
        </ClientProvider>
      </OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

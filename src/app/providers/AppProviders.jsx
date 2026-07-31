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
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}

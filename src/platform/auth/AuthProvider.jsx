import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  authenticationService,
  identityRepository,
} from "../../services/auth";

import {
  buildAuthBootstrap,
} from "./AuthBootstrap";

import {
  AuthContext,
} from "./AuthContext";

const SELECTED_ORGANIZATION_KEY =
  "worklynk.selectedOrganizationId";

const INITIAL_STATE = {
  initialized: false,
  loading: true,
  session: null,
  user: null,
  profile: null,
  memberships: [],
  selectedMembership: null,
  organization: null,
  roles: [],
  permissions: [],
  isPlatformAdministrator: false,
  accessStatus: "loading",
  workspaceReady: false,
  error: null,
};

function getStoredOrganizationId() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return (
    window.localStorage.getItem(
      SELECTED_ORGANIZATION_KEY,
    ) || null
  );
}

function storeOrganizationId(
  organizationId,
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  if (organizationId) {
    window.localStorage.setItem(
      SELECTED_ORGANIZATION_KEY,
      organizationId,
    );
    return;
  }

  window.localStorage.removeItem(
    SELECTED_ORGANIZATION_KEY,
  );
}

export default function AuthProvider({
  children,
}) {
  const [
    state,
    setState,
  ] = useState(INITIAL_STATE);

  const bootstrapSequence =
    useRef(0);

  const bootstrapSession =
    useCallback(
      async (
        session,
        preferredOrganizationId =
          getStoredOrganizationId(),
      ) => {
        const sequence =
          bootstrapSequence.current +
          1;

        bootstrapSequence.current =
          sequence;

        setState(
          (current) => ({
            ...current,
            loading: true,
            error: null,
          }),
        );

        try {
          if (!session?.user) {
            if (
              sequence !==
              bootstrapSequence.current
            ) {
              return;
            }

            setState({
              ...INITIAL_STATE,
              initialized: true,
              loading: false,
              accessStatus:
                "unauthenticated",
            });

            return;
          }

          const identity =
            await identityRepository
              .loadIdentity(
                session.user.id,
              );

          if (
            sequence !==
            bootstrapSequence.current
          ) {
            return;
          }

          const bootstrap =
            buildAuthBootstrap({
              session,
              identity,
              preferredOrganizationId,
            });

          if (
            bootstrap.organization?.id
          ) {
            storeOrganizationId(
              bootstrap.organization.id,
            );
          } else {
            storeOrganizationId(null);
          }

          setState({
            ...bootstrap,
            initialized: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          if (
            sequence !==
            bootstrapSequence.current
          ) {
            return;
          }

          setState(
            (current) => ({
              ...current,
              initialized: true,
              loading: false,
              workspaceReady: false,
              accessStatus:
                "bootstrap_error",
              error,
            }),
          );
        }
      },
      [],
    );

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const session =
          await authenticationService
            .getCurrentSession();

        if (!active) {
          return;
        }

        await bootstrapSession(
          session,
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setState(
          (current) => ({
            ...current,
            initialized: true,
            loading: false,
            workspaceReady: false,
            accessStatus:
              "bootstrap_error",
            error,
          }),
        );
      }
    }

    initialize();

    const unsubscribe =
      authenticationService
        .onAuthStateChange(
          ({
            event,
            session,
          }) => {
            if (!active) {
              return;
            }

            if (
              event ===
                "TOKEN_REFRESHED" ||
              event ===
                "USER_UPDATED"
            ) {
              setState(
                (current) => ({
                  ...current,
                  session,
                  user:
                    session?.user ??
                    null,
                }),
              );

              return;
            }

            void bootstrapSession(
              session,
            );
          },
        );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [
    bootstrapSession,
  ]);

  const signIn =
    useCallback(
      async ({
        email,
        password,
      }) => {
        const result =
          await authenticationService
            .signIn({
              email,
              password,
            });

        await bootstrapSession(
          result.session,
        );

        return result;
      },
      [
        bootstrapSession,
      ],
    );

  const signOut =
    useCallback(
      async () => {
        await authenticationService
          .signOut();

        storeOrganizationId(null);

        setState({
          ...INITIAL_STATE,
          initialized: true,
          loading: false,
          accessStatus:
            "unauthenticated",
        });
      },
      [],
    );

  const refreshIdentity =
    useCallback(
      async () => {
        const session =
          await authenticationService
            .getCurrentSession();

        await bootstrapSession(
          session,
          state.organization?.id,
        );
      },
      [
        bootstrapSession,
        state.organization?.id,
      ],
    );

  const selectOrganization =
    useCallback(
      async (
        organizationId,
      ) => {
        if (!organizationId) {
          return;
        }

        const membership =
          state.memberships.find(
            (candidate) =>
              candidate
                .organizationId ===
              organizationId,
          );

        if (
          !membership ||
          membership.status !==
            "active" ||
          membership.organization
            ?.status !== "active"
        ) {
          throw new Error(
            "The selected organization is not available.",
          );
        }

        storeOrganizationId(
          organizationId,
        );

        await bootstrapSession(
          state.session,
          organizationId,
        );
      },
      [
        bootstrapSession,
        state.memberships,
        state.session,
      ],
    );

  const hasPermission =
    useCallback(
      (
        permissionCode,
      ) => {
        if (!permissionCode) {
          return false;
        }

        if (
          state
            .isPlatformAdministrator
        ) {
          return true;
        }

        return state.permissions
          .includes(
            permissionCode,
          );
      },
      [
        state
          .isPlatformAdministrator,
        state.permissions,
      ],
    );

  const value =
    useMemo(
      () => ({
        ...state,
        authenticated:
          Boolean(state.user),
        organizationId:
          state.organization?.id ??
          null,
        membershipId:
          state
            .selectedMembership?.id ??
          null,
        signIn,
        signOut,
        refreshIdentity,
        selectOrganization,
        hasPermission,
        requestPasswordReset:
          authenticationService
            .requestPasswordReset
            .bind(
              authenticationService,
            ),
        updatePassword:
          authenticationService
            .updatePassword
            .bind(
              authenticationService,
            ),
      }),
      [
        state,
        signIn,
        signOut,
        refreshIdentity,
        selectOrganization,
        hasPermission,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

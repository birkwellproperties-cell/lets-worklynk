import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "../../../platform/auth";

import {
  organizationMembersService,
  organizationService,
} from "../services";

import {
  OrganizationContext,
} from "./OrganizationContext";

const INITIAL_STATE = {
  initialized: false,
  loading: false,
  saving: false,
  error: null,

  organization: null,
  profile: null,
  clientProfile: null,
  contractorProfile: null,

  locations: [],
  departments: [],
  settings: [],
  branding: null,
  billingProfile: null,

  members: [],
  memberRoles: [],
  memberPermissions: [],
  selectedMemberId: null,
  membersLoading: false,
  membersSaving: false,
  memberPermissionsLoading: false,
};

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    "An unexpected organization error occurred.",
  );
}

export default function OrganizationProvider({
  children,
}) {
  const {
    organizationId,
    workspaceReady,
    user,
    isPlatformAdministrator,
    refreshIdentity,
  } = useAuth();

  const [
    state,
    setState,
  ] = useState(INITIAL_STATE);

  const requestSequence =
    useRef(0);

  const loadWorkspace =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        const sequence =
          requestSequence.current + 1;

        requestSequence.current =
          sequence;

        if (
          !workspaceReady ||
          !organizationId
        ) {
          setState({
            ...INITIAL_STATE,
            initialized: true,
          });

          return null;
        }

        if (!silent) {
          setState(
            (current) => ({
              ...current,
              loading: true,
              error: null,
            }),
          );
        }

        try {
          const workspace =
            await organizationService
              .loadWorkspace(
                organizationId,
              );

          if (
            sequence !==
            requestSequence.current
          ) {
            return null;
          }

          const billingProfile =
            await organizationService
              .getBillingProfile(
                organizationId,
              );

          if (
            sequence !==
            requestSequence.current
          ) {
            return null;
          }

          const [
            members,
            memberRoles,
            memberPermissions,
          ] = await Promise.all([
            organizationMembersService
              .getMembers(
                organizationId,
              ),

            organizationMembersService
              .getRoles(
                organizationId,
              ),

            organizationMembersService
              .getPermissions(),
          ]);

          if (
            sequence !==
            requestSequence.current
          ) {
            return null;
          }

          setState({
            initialized: true,
            loading: false,
            saving: false,
            error: null,

            organization:
              workspace?.organization ??
              null,

            profile:
              workspace?.profile ??
              null,

            clientProfile:
              workspace?.clientProfile ??
              null,

            contractorProfile:
              workspace
                ?.contractorProfile ??
              null,

            locations:
              workspace?.locations ??
              [],

            departments:
              workspace?.departments ??
              [],

            settings:
              workspace?.settings ??
              [],

            branding:
              workspace?.branding ??
              null,

            billingProfile:
              billingProfile ?? null,

            members,
            memberRoles,
            memberPermissions,

            selectedMemberId:
              members[0]
                ?.membershipId ??
              null,

            membersLoading: false,
            membersSaving: false,
            memberPermissionsLoading: false,
          });

          return {
            ...workspace,
            billingProfile,
            members,
            memberRoles,
            memberPermissions,
          };
        } catch (error) {
          if (
            sequence !==
            requestSequence.current
          ) {
            return null;
          }

          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              initialized: true,
              loading: false,
              saving: false,
              error:
                normalizedError,
            }),
          );

          throw normalizedError;
        }
      },
      [
        organizationId,
        workspaceReady,
      ],
    );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadWorkspace();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    loadWorkspace,
  ]);

  const runSave =
    useCallback(
      async (
        operation,
      ) => {
        setState(
          (current) => ({
            ...current,
            saving: true,
            error: null,
          }),
        );

        try {
          const result =
            await operation();

          setState(
            (current) => ({
              ...current,
              saving: false,
            }),
          );

          return result;
        } catch (error) {
          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              saving: false,
              error:
                normalizedError,
            }),
          );

          throw normalizedError;
        }
      },
      [],
    );

  const updateOrganization =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const organization =
              await organizationService
                .updateOrganization(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                organization,
              }),
            );

            await refreshIdentity();

            return organization;
          },
        ),
      [
        organizationId,
        refreshIdentity,
        runSave,
      ],
    );

  const saveProfile =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const profile =
              await organizationService
                .saveProfile(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                profile,
              }),
            );

            return profile;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const saveClientProfile =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const clientProfile =
              await organizationService
                .saveClientProfile(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                clientProfile,
              }),
            );

            return clientProfile;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const saveContractorProfile =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const contractorProfile =
              await organizationService
                .saveContractorProfile(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                contractorProfile,
              }),
            );

            return contractorProfile;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const createLocation =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const location =
              await organizationService
                .createLocation(
                  organizationId,
                  payload,
                );

            const locations =
              await organizationService
                .getLocations(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                locations,
              }),
            );

            return location;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const updateLocation =
    useCallback(
      async (
        locationId,
        payload,
      ) =>
        runSave(
          async () => {
            const location =
              await organizationService
                .updateLocation(
                  locationId,
                  payload,
                );

            const locations =
              await organizationService
                .getLocations(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                locations,
              }),
            );

            return location;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const archiveLocation =
    useCallback(
      async (
        locationId,
      ) =>
        runSave(
          async () => {
            const location =
              await organizationService
                .archiveLocation(
                  locationId,
                  user?.id ?? null,
                );

            const locations =
              await organizationService
                .getLocations(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                locations,
              }),
            );

            return location;
          },
        ),
      [
        organizationId,
        runSave,
        user?.id,
      ],
    );

  const createDepartment =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const department =
              await organizationService
                .createDepartment(
                  organizationId,
                  payload,
                );

            const departments =
              await organizationService
                .getDepartments(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                departments,
              }),
            );

            return department;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const updateDepartment =
    useCallback(
      async (
        departmentId,
        payload,
      ) =>
        runSave(
          async () => {
            const department =
              await organizationService
                .updateDepartment(
                  departmentId,
                  payload,
                );

            const departments =
              await organizationService
                .getDepartments(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                departments,
              }),
            );

            return department;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const archiveDepartment =
    useCallback(
      async (
        departmentId,
      ) =>
        runSave(
          async () => {
            const department =
              await organizationService
                .archiveDepartment(
                  departmentId,
                  user?.id ?? null,
                );

            const departments =
              await organizationService
                .getDepartments(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                departments,
              }),
            );

            return department;
          },
        ),
      [
        organizationId,
        runSave,
        user?.id,
      ],
    );

  const saveSetting =
    useCallback(
      async (
        settingKey,
        settingValue,
        options,
      ) =>
        runSave(
          async () => {
            const setting =
              await organizationService
                .saveSetting(
                  organizationId,
                  settingKey,
                  settingValue,
                  options,
                );

            const settings =
              await organizationService
                .getSettings(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                settings,
              }),
            );

            return setting;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const deleteSetting =
    useCallback(
      async (
        settingKey,
      ) =>
        runSave(
          async () => {
            await organizationService
              .deleteSetting(
                organizationId,
                settingKey,
              );

            const settings =
              await organizationService
                .getSettings(
                  organizationId,
                );

            setState(
              (current) => ({
                ...current,
                settings,
              }),
            );
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const saveBranding =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const branding =
              await organizationService
                .saveBranding(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                branding,
              }),
            );

            return branding;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const saveBillingProfile =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const billingProfile =
              await organizationService
                .saveBillingProfile(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                billingProfile,
              }),
            );

            return billingProfile;
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const refreshMembers =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !workspaceReady ||
          !organizationId
        ) {
          setState(
            (current) => ({
              ...current,
              members: [],
              memberRoles: [],
              memberPermissions: [],
              selectedMemberId: null,
              membersLoading: false,
              memberPermissionsLoading: false,
            }),
          );

          return {
            members: [],
            roles: [],
          };
        }

        if (!silent) {
          setState(
            (current) => ({
              ...current,
              membersLoading: true,
              error: null,
            }),
          );
        }

        try {
          const [
            members,
            roles,
            permissions,
          ] = await Promise.all([
            organizationMembersService
              .getMembers(
                organizationId,
              ),

            organizationMembersService
              .getRoles(
                organizationId,
              ),

            organizationMembersService
              .getPermissions(),
          ]);

          setState(
            (current) => {
              const selectedExists =
                members.some(
                  (member) =>
                    member.membershipId ===
                    current.selectedMemberId,
                );

              return {
                ...current,
                members,
                memberRoles: roles,
                memberPermissions:
                  permissions,

                selectedMemberId:
                  selectedExists
                    ? current.selectedMemberId
                    : members[0]
                        ?.membershipId ??
                      null,

                membersLoading: false,
              };
            },
          );

          return {
            members,
            roles,
            permissions,
          };
        } catch (error) {
          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              membersLoading: false,
              error: normalizedError,
            }),
          );

          throw normalizedError;
        }
      },
      [
        organizationId,
        workspaceReady,
      ],
    );

  const selectMember =
    useCallback(
      (
        membershipId,
      ) => {
        setState(
          (current) => ({
            ...current,

            selectedMemberId:
              membershipId,
          }),
        );
      },
      [],
    );

  const runMemberSave =
    useCallback(
      async (
        operation,
      ) => {
        setState(
          (current) => ({
            ...current,
            membersSaving: true,
            error: null,
          }),
        );

        try {
          const result =
            await operation();

          await refreshMembers({
            silent: true,
          });

          setState(
            (current) => ({
              ...current,
              membersSaving: false,
            }),
          );

          return result;
        } catch (error) {
          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              membersSaving: false,
              error: normalizedError,
            }),
          );

          throw normalizedError;
        }
      },
      [
        refreshMembers,
      ],
    );

  const updateMemberStatus =
    useCallback(
      async (
        membershipId,
        status,
        {
          title = null,
        } = {},
      ) =>
        runMemberSave(
          async () => {
            const member =
              state.members.find(
                (candidate) =>
                  candidate.membershipId ===
                  membershipId,
              );

            return organizationMembersService
              .updateStatus(
                membershipId,
                status,
                {
                  title,

                  currentUserId:
                    user?.id ?? null,

                  memberUserId:
                    member?.userId ??
                    null,

                  isPlatformAdministrator,
                },
              );
          },
        ),
      [
        isPlatformAdministrator,
        runMemberSave,
        state.members,
        user?.id,
      ],
    );

  const replaceMemberRoles =
    useCallback(
      async (
        membershipId,
        roleIds,
      ) =>
        runMemberSave(
          () =>
            organizationMembersService
              .replaceRoles(
                membershipId,
                roleIds,
              ),
        ),
      [
        runMemberSave,
      ],
    );

  const setMemberPermissionOverride =
    useCallback(
      async (
        membershipId,
        permissionCode,
        effect,
        options,
      ) =>
        runMemberSave(
          () =>
            organizationMembersService
              .setPermissionOverride(
                membershipId,
                permissionCode,
                effect,
                options,
              ),
        ),
      [
        runMemberSave,
      ],
    );

  const removeMemberPermissionOverride =
    useCallback(
      async (
        membershipId,
        permissionCode,
      ) =>
        runMemberSave(
          () =>
            organizationMembersService
              .removePermissionOverride(
                membershipId,
                permissionCode,
              ),
        ),
      [
        runMemberSave,
      ],
    );
  const clearError =
    useCallback(
      () => {
        setState(
          (current) => ({
            ...current,
            error: null,
          }),
        );
      },
      [],
    );

  const value =
    useMemo(
      () => ({
        ...state,

        organizationId,

        organizationType:
          state.organization
            ?.organizationType ??
          null,

        isPlatformOrganization:
          state.organization
            ?.organizationType ===
          "platform",

        isClientOrganization:
          state.organization
            ?.organizationType ===
          "client",

        isContractorOrganization:
          state.organization
            ?.organizationType ===
          "contractor",

        refresh:
          loadWorkspace,

        updateOrganization,
        saveProfile,
        saveClientProfile,
        saveContractorProfile,

        createLocation,
        updateLocation,
        archiveLocation,

        createDepartment,
        updateDepartment,
        archiveDepartment,

        saveSetting,
        deleteSetting,

        saveBranding,
        saveBillingProfile,

        selectedMember:
          state.members.find(
            (member) =>
              member.membershipId ===
              state.selectedMemberId,
          ) ?? null,

        refreshMembers,
        selectMember,
        updateMemberStatus,
        replaceMemberRoles,
        setMemberPermissionOverride,
        removeMemberPermissionOverride,

        clearError,
      }),
      [
        state,
        organizationId,
        loadWorkspace,
        updateOrganization,
        saveProfile,
        saveClientProfile,
        saveContractorProfile,
        createLocation,
        updateLocation,
        archiveLocation,
        createDepartment,
        updateDepartment,
        archiveDepartment,
        saveSetting,
        deleteSetting,
        saveBranding,
        saveBillingProfile,
        refreshMembers,
        selectMember,
        updateMemberStatus,
        replaceMemberRoles,
        setMemberPermissionOverride,
        removeMemberPermissionOverride,
        clearError,
      ],
    );

  return (
    <OrganizationContext.Provider
      value={value}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

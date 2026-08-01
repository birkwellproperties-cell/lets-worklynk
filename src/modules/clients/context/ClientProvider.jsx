import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "../../../platform/auth";

import {
  clientDocumentsService,
  clientOrganizationService,
} from "../services";

import {
  ClientContext,
} from "./ClientContext";

const INITIAL_STATE = {
  clients: [],
  selectedRelationshipId: null,
  selectedClientWorkspace: null,

  filters: {
    search: "",
    status: "all",
  },

  loading: false,
  workspaceLoading: false,
  saving: false,
  error: null,
};

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    error?.message ||
    "An unexpected client-management error occurred.",
  );
}

export default function ClientProvider({
  children,
}) {
  const {
    organizationId,
    workspaceReady,
    user,
  } = useAuth();

  const [
    state,
    setState,
  ] = useState(
    INITIAL_STATE,
  );

  const requestSequence =
    useRef(0);

  const refreshClients =
    useCallback(
      async ({
        search,
        status,
        silent = false,
      } = {}) => {
        if (
          !workspaceReady ||
          !organizationId
        ) {
          setState(
            (current) => ({
              ...current,
              clients: [],
              selectedRelationshipId: null,
              selectedClientWorkspace: null,
              loading: false,
            }),
          );

          return [];
        }

        const nextSearch =
          search ??
          state.filters.search;

        const nextStatus =
          status ??
          state.filters.status;

        const sequence =
          ++requestSequence.current;

        if (!silent) {
          setState(
            (current) => ({
              ...current,
              loading: true,
              error: null,

              filters: {
                search:
                  nextSearch,
                status:
                  nextStatus,
              },
            }),
          );
        }

        try {
          const clients =
            await clientOrganizationService
              .getClientDirectory(
                organizationId,
                {
                  search:
                    nextSearch,
                  status:
                    nextStatus,
                },
              );

          if (
            sequence !==
            requestSequence.current
          ) {
            return clients;
          }

          setState(
            (current) => {
              const selectedExists =
                clients.some(
                  (client) =>
                    client.relationship
                      ?.id ===
                    current.selectedRelationshipId,
                );

              return {
                ...current,
                clients,
                loading: false,

                filters: {
                  search:
                    nextSearch,
                  status:
                    nextStatus,
                },

                selectedRelationshipId:
                  selectedExists
                    ? current.selectedRelationshipId
                    : clients[0]
                        ?.relationship
                        ?.id ??
                      null,
              };
            },
          );

          return clients;
        } catch (error) {
          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              loading: false,
              error:
                normalizedError,
            }),
          );

          throw normalizedError;
        }
      },
      [
        organizationId,
        state.filters.search,
        state.filters.status,
        workspaceReady,
      ],
    );

  const loadClientWorkspace =
    useCallback(
      async (
        relationshipId,
        {
          silent = false,
        } = {},
      ) => {
        if (
          !workspaceReady ||
          !organizationId ||
          !relationshipId
        ) {
          setState(
            (current) => ({
              ...current,
              selectedClientWorkspace:
                null,
              workspaceLoading:
                false,
            }),
          );

          return null;
        }

        if (!silent) {
          setState(
            (current) => ({
              ...current,
              workspaceLoading:
                true,
              error: null,
            }),
          );
        }

        try {
          const workspace =
            await clientOrganizationService
              .getClientWorkspace(
                organizationId,
                relationshipId,
              );

          setState(
            (current) => ({
              ...current,
              selectedRelationshipId:
                relationshipId,
              selectedClientWorkspace:
                workspace,
              workspaceLoading:
                false,
            }),
          );

          return workspace;
        } catch (error) {
          const normalizedError =
            normalizeError(error);

          setState(
            (current) => ({
              ...current,
              workspaceLoading:
                false,
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

  const selectClient =
    useCallback(
      async (
        relationshipId,
      ) => {
        setState(
          (current) => ({
            ...current,
            selectedRelationshipId:
              relationshipId,
          }),
        );

        return loadClientWorkspace(
          relationshipId,
        );
      },
      [
        loadClientWorkspace,
      ],
    );

  const runSave =
    useCallback(
      async (
        operation,
        {
          refreshDirectory = true,
          refreshWorkspace = true,
        } = {},
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

          const relationshipId =
            state.selectedRelationshipId;

          if (
            refreshDirectory
          ) {
            await refreshClients({
              silent: true,
            });
          }

          if (
            refreshWorkspace &&
            relationshipId
          ) {
            await loadClientWorkspace(
              relationshipId,
              {
                silent: true,
              },
            );
          }

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
      [
        loadClientWorkspace,
        refreshClients,
        state.selectedRelationshipId,
      ],
    );

  const createClient =
    useCallback(
      async (
        payload,
      ) =>
        runSave(
          async () => {
            const result =
              await clientOrganizationService
                .createClient(
                  organizationId,
                  payload,
                );

            setState(
              (current) => ({
                ...current,
                selectedRelationshipId:
                  result.relationship
                    ?.id ??
                  null,
              }),
            );

            return result;
          },
          {
            refreshWorkspace:
              false,
          },
        ),
      [
        organizationId,
        runSave,
      ],
    );

  const updateClientOrganization =
    useCallback(
      async (
        clientOrganizationId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .updateClientOrganization(
                clientOrganizationId,
                payload,
              ),
        ),
      [
        runSave,
      ],
    );

  const updateClientProfileWorkspace =
    useCallback(
      async (
        clientOrganizationId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .updateClientProfileWorkspace(
                clientOrganizationId,
                payload,
              ),
        ),
      [
        runSave,
      ],
    );
  const updateRelationship =
    useCallback(
      async (
        relationshipId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .updateRelationship(
                relationshipId,
                payload,
              ),
        ),
      [
        runSave,
      ],
    );

  const changeRelationshipStatus =
    useCallback(
      async (
        relationshipId,
        status,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .changeRelationshipStatus(
                relationshipId,
                status,
              ),
        ),
      [
        runSave,
      ],
    );

  const createContact =
    useCallback(
      async (
        clientOrganizationId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .createContact(
                clientOrganizationId,
                payload,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const updateContact =
    useCallback(
      async (
        contactId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .updateContact(
                contactId,
                payload,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const getClientContacts =
    useCallback(
      async (
        clientOrganizationId,
        options,
      ) =>
        clientOrganizationService
          .getContacts(
            clientOrganizationId,
            options,
          ),
      [],
    );

  const setPrimaryContact =
    useCallback(
      async (
        clientOrganizationId,
        contactId,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .setPrimaryContact(
                clientOrganizationId,
                contactId,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
      ],
    );
  const archiveContact =
    useCallback(
      async (
        contactId,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .archiveContact(
                contactId,
                user?.id ?? null,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const restoreContact =
    useCallback(
      async (
        contactId,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .restoreContact(
                contactId,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const getClientDocuments =
    useCallback(
      async (
        relationshipId,
        options,
      ) =>
        clientDocumentsService
          .getDocuments(
            relationshipId,
            options,
          ),
      [],
    );

  const getClientDocumentWorkspace =
    useCallback(
      async (
        documentId,
      ) =>
        clientDocumentsService
          .getDocumentWorkspace(
            documentId,
          ),
      [],
    );

  const createClientDocument =
    useCallback(
      async ({
        relationshipId,
        clientOrganizationId,
        payload,
        file,
      }) =>
        runSave(
          () =>
            clientDocumentsService
              .createDocument({
                relationshipId,
                clientOrganizationId,
                payload,
                file,
                actorUserId:
                  user?.id ?? null,
              }),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const uploadClientDocumentVersion =
    useCallback(
      async ({
        relationshipId,
        documentId,
        file,
        changeSummary,
      }) =>
        runSave(
          () =>
            clientDocumentsService
              .uploadVersion({
                relationshipId,
                documentId,
                file,
                changeSummary,
                actorUserId:
                  user?.id ?? null,
              }),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const updateClientDocument =
    useCallback(
      async (
        documentId,
        payload,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .updateDocument(
                documentId,
                payload,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const submitClientDocumentForReview =
    useCallback(
      async (
        documentId,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .submitForReview(
                documentId,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const approveClientDocument =
    useCallback(
      async (
        documentId,
        reviewNotes,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .approveDocument(
                documentId,
                user?.id ?? null,
                reviewNotes,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const rejectClientDocument =
    useCallback(
      async (
        documentId,
        reviewNotes,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .rejectDocument(
                documentId,
                user?.id ?? null,
                reviewNotes,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const archiveClientDocument =
    useCallback(
      async (
        documentId,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .archiveDocument(
                documentId,
                user?.id ?? null,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const restoreClientDocument =
    useCallback(
      async (
        documentId,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .restoreDocument(
                documentId,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const addClientDocumentNote =
    useCallback(
      async (
        documentId,
        payload,
      ) =>
        runSave(
          () =>
            clientDocumentsService
              .addNote(
                documentId,
                payload,
                user?.id ?? null,
              ),
          {
            refreshDirectory:
              false,
            refreshWorkspace:
              false,
          },
        ),
      [
        runSave,
        user?.id,
      ],
    );

  const createClientDocumentSignedUrl =
    useCallback(
      async (
        versionId,
        expiresInSeconds,
      ) =>
        clientDocumentsService
          .createSignedUrl(
            versionId,
            expiresInSeconds,
          ),
      [],
    );

  const downloadClientDocumentVersion =
    useCallback(
      async (
        versionId,
      ) =>
        clientDocumentsService
          .downloadVersion(
            versionId,
          ),
      [],
    );
  const saveOnboarding =
    useCallback(
      async (
        relationshipId,
        payload,
      ) =>
        runSave(
          () =>
            clientOrganizationService
              .saveOnboarding(
                relationshipId,
                payload,
              ),
          {
            refreshDirectory:
              false,
          },
        ),
      [
        runSave,
      ],
    );

  const setFilters =
    useCallback(
      (
        filters,
      ) => {
        setState(
          (current) => ({
            ...current,

            filters: {
              ...current.filters,
              ...filters,
            },
          }),
        );
      },
      [],
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

        selectedClient:
          state.clients.find(
            (client) =>
              client.relationship
                ?.id ===
              state.selectedRelationshipId,
          ) ?? null,

        refreshClients,
        loadClientWorkspace,
        selectClient,
        createClient,
        updateClientOrganization,
        updateClientProfileWorkspace,
        updateRelationship,
        changeRelationshipStatus,
        createContact,
        updateContact,
        getClientContacts,
        setPrimaryContact,
        archiveContact,
        restoreContact,
        getClientDocuments,
        getClientDocumentWorkspace,
        createClientDocument,
        uploadClientDocumentVersion,
        updateClientDocument,
        submitClientDocumentForReview,
        approveClientDocument,
        rejectClientDocument,
        archiveClientDocument,
        restoreClientDocument,
        addClientDocumentNote,
        createClientDocumentSignedUrl,
        downloadClientDocumentVersion,
        saveOnboarding,
        setFilters,
        clearError,
      }),
      [
        addClientDocumentNote,
        approveClientDocument,
        archiveClientDocument,
        archiveContact,
        changeRelationshipStatus,
        createClientDocument,
        createClientDocumentSignedUrl,
        clearError,
        createClient,
        createContact,
        downloadClientDocumentVersion,
        getClientContacts,
        getClientDocumentWorkspace,
        getClientDocuments,
        loadClientWorkspace,
        refreshClients,
        rejectClientDocument,
        restoreClientDocument,
        restoreContact,
        saveOnboarding,
        selectClient,
        setPrimaryContact,
        setFilters,
        state,
        submitClientDocumentForReview,
        updateClientDocument,
        uploadClientDocumentVersion,
        updateClientOrganization,
        updateClientProfileWorkspace,
        updateContact,
        updateRelationship,
      ],
    );

  return (
    <ClientContext.Provider
      value={value}
    >
      {children}
    </ClientContext.Provider>
  );
}

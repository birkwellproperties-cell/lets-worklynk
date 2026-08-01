import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileClock,
  FilePlus2,
  FileText,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useOutletContext,
} from "react-router";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useClient,
} from "../context";

import {
  formatClientDate,
  formatStatusLabel,
} from "../utils";

const DOCUMENT_TYPES = [
  {
    value: "all",
    label: "All document types",
  },
  {
    value: "master_service_agreement",
    label: "Master service agreement",
  },
  {
    value: "business_associate_agreement",
    label: "Business associate agreement",
  },
  {
    value: "non_disclosure_agreement",
    label: "Non-disclosure agreement",
  },
  {
    value: "certificate_of_insurance",
    label: "Certificate of insurance",
  },
  {
    value: "w9",
    label: "W-9",
  },
  {
    value: "ach_authorization",
    label: "ACH authorization",
  },
  {
    value: "rate_agreement",
    label: "Rate agreement",
  },
  {
    value: "facility_requirements",
    label: "Facility requirements",
  },
  {
    value: "orientation_packet",
    label: "Orientation packet",
  },
  {
    value: "compliance_document",
    label: "Compliance document",
  },
  {
    value: "vendor_packet",
    label: "Vendor packet",
  },
  {
    value: "other",
    label: "Other",
  },
];

const DOCUMENT_STATUSES = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "uploaded",
    label: "Uploaded",
  },
  {
    value: "under_review",
    label: "Under review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const EMPTY_UPLOAD_FORM = {
  documentType:
    "master_service_agreement",

  title: "",
  description: "",
  isRequired: false,
  effectiveDate: "",
  expirationDate: "",
  changeSummary:
    "Initial upload.",
  file: null,
};

function getTypeLabel(value) {
  return (
    DOCUMENT_TYPES.find(
      (option) =>
        option.value === value,
    )?.label ??
    formatStatusLabel(value)
  );
}

function formatFileSize(value) {
  const bytes =
    Number(value) || 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function isExpired(document) {
  if (
    !document?.expirationDate
  ) {
    return false;
  }

  const expiration =
    new Date(
      `${document.expirationDate}T23:59:59`,
    );

  return (
    !Number.isNaN(
      expiration.getTime(),
    ) &&
    expiration <
      new Date()
  );
}

function isExpiringSoon(document) {
  if (
    !document?.expirationDate ||
    isExpired(document)
  ) {
    return false;
  }

  const expiration =
    new Date(
      `${document.expirationDate}T23:59:59`,
    );

  if (
    Number.isNaN(
      expiration.getTime(),
    )
  ) {
    return false;
  }

  const thirtyDays =
    30 *
    24 *
    60 *
    60 *
    1000;

  return (
    expiration.getTime() -
      Date.now() <=
    thirtyDays
  );
}

function getStatusClasses(status) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "under_review":
      return "bg-blue-50 text-blue-700";

    case "uploaded":
      return "bg-violet-50 text-violet-700";

    case "draft":
      return "bg-slate-100 text-slate-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "expired":
      return "bg-orange-50 text-orange-700";

    case "archived":
      return "bg-slate-200 text-slate-600";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ClientDocumentsPage() {
  const {
    workspace,
    relationshipId,
  } = useOutletContext();

  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    saving,
    error,
    getClientDocuments,
    getClientDocumentWorkspace,
    createClientDocument,
    submitClientDocumentForReview,
    approveClientDocument,
    rejectClientDocument,
    archiveClientDocument,
    restoreClientDocument,
    createClientDocumentSignedUrl,
    downloadClientDocumentVersion,
    clearError,
  } = useClient();

  const [
    documents,
    setDocuments,
  ] = useState([]);

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState(null);

  const [
    selectedWorkspace,
    setSelectedWorkspace,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    uploadDialogOpen,
    setUploadDialogOpen,
  ] = useState(false);

  const [
    reviewDialog,
    setReviewDialog,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canView =
    isPlatformAdministrator ||
    hasPermission(
      "client_documents.view",
    ) ||
    hasPermission(
      "client_documents.manage",
    );

  const canUpload =
    isPlatformAdministrator ||
    hasPermission(
      "client_documents.upload",
    ) ||
    hasPermission(
      "client_documents.manage",
    );

  const canUpdate =
    isPlatformAdministrator ||
    hasPermission(
      "client_documents.update",
    ) ||
    hasPermission(
      "client_documents.manage",
    );

  const canArchive =
    isPlatformAdministrator ||
    hasPermission(
      "client_documents.delete",
    ) ||
    hasPermission(
      "client_documents.manage",
    );

  const loadDocuments =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!canView) {
          setDocuments([]);
          return [];
        }

        if (!silent) {
          setLoading(true);
        }

        try {
          const records =
            await getClientDocuments(
              relationshipId,
              {
                includeArchived:
                  true,
              },
            );

          setDocuments(records);

          setSelectedDocumentId(
            (current) => {
              const stillExists =
                records.some(
                  (document) =>
                    document.id ===
                    current,
                );

              return stillExists
                ? current
                : records[0]?.id ??
                    null;
            },
          );

          return records;
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        getClientDocuments,
        relationshipId,
      ],
    );

  const loadDocumentWorkspace =
    useCallback(
      async (
        documentId,
        {
          silent = false,
        } = {},
      ) => {
        if (!documentId) {
          setSelectedWorkspace(null);
          return null;
        }

        if (!silent) {
          setDetailsLoading(true);
        }

        try {
          const result =
            await getClientDocumentWorkspace(
              documentId,
            );

          setSelectedWorkspace(
            result,
          );

          return result;
        } finally {
          setDetailsLoading(false);
        }
      },
      [
        getClientDocumentWorkspace,
      ],
    );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void loadDocuments();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    loadDocuments,
  ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void loadDocumentWorkspace(
            selectedDocumentId,
          );
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    loadDocumentWorkspace,
    selectedDocumentId,
  ]);

  const filteredDocuments =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return documents.filter(
          (document) => {
            const searchable = [
              document.title,
              document.description,
              document.documentType,
              document.documentNumber,
              document.status,
            ];

            const matchesSearch =
              !normalizedSearch ||
              searchable.some(
                (value) =>
                  String(value ?? "")
                    .toLowerCase()
                    .includes(
                      normalizedSearch,
                    ),
              );

            const matchesType =
              typeFilter === "all" ||
              document.documentType ===
                typeFilter;

            const matchesStatus =
              statusFilter === "all" ||
              document.status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesType &&
              matchesStatus
            );
          },
        );
      },
      [
        documents,
        search,
        statusFilter,
        typeFilter,
      ],
    );

  const metrics =
    useMemo(
      () => ({
        total:
          documents.filter(
            (document) =>
              !document.archivedAt,
          ).length,

        required:
          documents.filter(
            (document) =>
              !document.archivedAt &&
              document.isRequired,
          ).length,

        underReview:
          documents.filter(
            (document) =>
              !document.archivedAt &&
              document.status ===
                "under_review",
          ).length,

        expiring:
          documents.filter(
            (document) =>
              !document.archivedAt &&
              (
                isExpired(
                  document,
                ) ||
                isExpiringSoon(
                  document,
                )
              ),
          ).length,
      }),
      [
        documents,
      ],
    );

  async function refreshAfterOperation(
    message,
    documentId =
      selectedDocumentId,
  ) {
    await loadDocuments({
      silent: true,
    });

    if (documentId) {
      await loadDocumentWorkspace(
        documentId,
        {
          silent: true,
        },
      );
    }

    setSuccessMessage(
      message,
    );
  }

  async function runOperation(
    operation,
    message,
    documentId,
  ) {
    clearError();
    setSuccessMessage("");

    try {
      await operation();

      await refreshAfterOperation(
        message,
        documentId,
      );

      return true;
    } catch {
      return false;
    }
  }

  async function handlePreview() {
    const versionId =
      selectedWorkspace
        ?.document
        ?.currentVersionId;

    if (!versionId) {
      return;
    }

    clearError();

    try {
      const signedUrl =
        await createClientDocumentSignedUrl(
          versionId,
          300,
        );

      if (!signedUrl) {
        throw new Error(
          "A signed preview URL could not be created.",
        );
      }

      window.open(
        signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      // Provider exposes errors for managed operations.
    }
  }

  async function handleDownload() {
    const versionId =
      selectedWorkspace
        ?.document
        ?.currentVersionId;

    if (!versionId) {
      return;
    }

    clearError();

    try {
      const result =
        await downloadClientDocumentVersion(
          versionId,
        );

      const url =
        URL.createObjectURL(
          result.blob,
        );

      const anchor =
        document.createElement(
          "a",
        );

      anchor.href = url;
      anchor.download =
        result.fileName ||
        "client-document";

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url,
      );
    } catch {
      // Provider exposes errors for managed operations.
    }
  }

  async function handleArchive() {
    const document =
      selectedWorkspace?.document;

    if (!document) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${document.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    await runOperation(
      () =>
        archiveClientDocument(
          document.id,
        ),
      "Client document archived.",
      document.id,
    );
  }

  async function handleRestore() {
    const document =
      selectedWorkspace?.document;

    if (!document) {
      return;
    }

    await runOperation(
      () =>
        restoreClientDocument(
          document.id,
        ),
      "Client document restored.",
      document.id,
    );
  }

  if (!canView) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
        <ShieldCheck
          size={42}
          className="mx-auto text-amber-600"
        />

        <h1 className="mt-5 text-2xl font-bold text-amber-950">
          Document access restricted
        </h1>

        <p className="mx-auto mt-3 max-w-2xl leading-7 text-amber-800">
          Your current role does not include permission to view
          client documents.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
            Client workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Client documents
          </h1>

          <p className="mt-2 max-w-3xl leading-7 text-slate-600">
            Manage contracts, insurance, tax forms, rate agreements,
            compliance files, review status, expiration, and document
            versions.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void loadDocuments();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={18} />
            )}

            Refresh
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={() => {
                clearError();
                setSuccessMessage("");
                setUploadDialogOpen(
                  true,
                );
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
            >
              <FilePlus2 size={18} />
              Upload document
            </button>
          )}
        </div>
      </section>

      {error && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Document operation failed"
          message={error.message}
        />
      )}

      {successMessage && (
        <MessagePanel
          icon={CheckCircle2}
          tone="success"
          title="Document operation completed"
          message={
            successMessage
          }
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Active documents"
          value={metrics.total}
        />

        <MetricCard
          icon={FileCheck2}
          label="Required"
          value={metrics.required}
        />

        <MetricCard
          icon={FileClock}
          label="Under review"
          value={metrics.underReview}
        />

        <MetricCard
          icon={CalendarClock}
          label="Expired or expiring"
          value={metrics.expiring}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px_230px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Search documents..."
              className="w-full border-0 bg-transparent py-3 outline-none"
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(
                event.target.value,
              );
            }}
            className={inputClassName}
          >
            {DOCUMENT_TYPES.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value,
              );
            }}
            className={inputClassName}
          >
            {DOCUMENT_STATUSES.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      <section className="grid min-h-[620px] gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm font-bold text-slate-700">
              {filteredDocuments.length} document
              {filteredDocuments.length === 1
                ? ""
                : "s"}
            </p>
          </header>

          {loading ? (
            <LoadingState />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              canUpload={canUpload}
              onUpload={() => {
                setUploadDialogOpen(
                  true,
                );
              }}
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredDocuments.map(
                (document) => (
                  <DocumentListItem
                    key={document.id}
                    document={document}
                    selected={
                      document.id ===
                      selectedDocumentId
                    }
                    onSelect={() => {
                      setSelectedDocumentId(
                        document.id,
                      );
                    }}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <DocumentDetailsPanel
          workspace={
            selectedWorkspace
          }
          loading={
            detailsLoading
          }
          saving={saving}
          canUpdate={canUpdate}
          canArchive={canArchive}
          onPreview={() => {
            void handlePreview();
          }}
          onDownload={() => {
            void handleDownload();
          }}
          onSubmitForReview={() => {
            const document =
              selectedWorkspace
                ?.document;

            if (!document) {
              return;
            }

            void runOperation(
              () =>
                submitClientDocumentForReview(
                  document.id,
                ),
              "Document submitted for review.",
              document.id,
            );
          }}
          onApprove={() => {
            setReviewDialog({
              mode: "approve",
            });
          }}
          onReject={() => {
            setReviewDialog({
              mode: "reject",
            });
          }}
          onArchive={() => {
            void handleArchive();
          }}
          onRestore={() => {
            void handleRestore();
          }}
        />
      </section>

      {uploadDialogOpen && (
        <UploadDocumentDialog
          saving={saving}
          onClose={() => {
            setUploadDialogOpen(
              false,
            );
          }}
          onSubmit={(payload) => {
            void runOperation(
              async () => {
                const result =
                  await createClientDocument({
                    relationshipId,
                    clientOrganizationId:
                      workspace.organization
                        .id,
                    payload,
                    file:
                      payload.file,
                  });

                setUploadDialogOpen(
                  false,
                );

                if (
                  result?.document?.id
                ) {
                  setSelectedDocumentId(
                    result.document.id,
                  );
                }
              },
              "Client document uploaded.",
            );
          }}
        />
      )}

      {reviewDialog && (
        <ReviewDialog
          mode={reviewDialog.mode}
          saving={saving}
          onClose={() => {
            setReviewDialog(null);
          }}
          onSubmit={(notes) => {
            const document =
              selectedWorkspace
                ?.document;

            if (!document) {
              return;
            }

            void runOperation(
              async () => {
                if (
                  reviewDialog.mode ===
                  "approve"
                ) {
                  await approveClientDocument(
                    document.id,
                    notes,
                  );
                } else {
                  await rejectClientDocument(
                    document.id,
                    notes,
                  );
                }

                setReviewDialog(
                  null,
                );
              },
              reviewDialog.mode ===
                "approve"
                ? "Document approved."
                : "Document rejected.",
              document.id,
            );
          }}
        />
      )}
    </div>
  );
}

function DocumentListItem({
  document,
  selected,
  onSelect,
}) {
  const expired =
    isExpired(document);

  const expiringSoon =
    isExpiringSoon(document);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full p-5 text-left transition sm:p-6",
        selected
          ? "bg-blue-50"
          : "hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <FileText size={20} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-bold text-slate-950">
              {document.title}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-bold",
                getStatusClasses(
                  document.status,
                ),
              ].join(" ")}
            >
              {formatStatusLabel(
                document.status,
              )}
            </span>

            {document.isRequired && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                Required
              </span>
            )}
          </span>

          <span className="mt-1 block text-sm text-slate-600">
            {getTypeLabel(
              document.documentType,
            )}
          </span>

          <span className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
            <span>
              Document #
              {document.documentNumber}
            </span>

            <span>
              Version{" "}
              {document.currentVersionNumber}
            </span>

            {document.expirationDate && (
              <span
                className={
                  expired
                    ? "text-red-700"
                    : expiringSoon
                      ? "text-amber-700"
                      : ""
                }
              >
                Expires{" "}
                {formatClientDate(
                  document.expirationDate,
                )}
              </span>
            )}
          </span>
        </span>
      </div>
    </button>
  );
}

function DocumentDetailsPanel({
  workspace,
  loading,
  saving,
  canUpdate,
  canArchive,
  onPreview,
  onDownload,
  onSubmitForReview,
  onApprove,
  onReject,
  onArchive,
  onRestore,
}) {
  if (loading) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-600"
        />
      </section>
    );
  }

  if (!workspace?.document) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div>
          <FileText
            size={42}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Select a document
          </h2>

          <p className="mt-2 text-slate-600">
            Choose a document to review its metadata and current
            version.
          </p>
        </div>
      </section>
    );
  }

  const {
    document,
    versions,
    notes,
    activity,
  } = workspace;

  const currentVersion =
    versions.find(
      (version) =>
        version.id ===
        document.currentVersionId,
    ) ??
    versions[0] ??
    null;

  const archived =
    Boolean(
      document.archivedAt,
    );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-bold",
                getStatusClasses(
                  document.status,
                ),
              ].join(" ")}
            >
              {formatStatusLabel(
                document.status,
              )}
            </span>

            {document.isRequired && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Required
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold text-slate-950">
            {document.title}
          </h2>

          <p className="mt-2 text-slate-600">
            {getTypeLabel(
              document.documentType,
            )}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Document
          </p>

          <p className="mt-1 font-bold text-slate-950">
            #{document.documentNumber}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <DetailItem
          label="Current version"
          value={`Version ${document.currentVersionNumber}`}
        />

        <DetailItem
          label="Effective date"
          value={formatClientDate(
            document.effectiveDate,
          )}
        />

        <DetailItem
          label="Expiration date"
          value={formatClientDate(
            document.expirationDate,
          )}
          warning={
            isExpired(document) ||
            isExpiringSoon(document)
          }
        />

        <DetailItem
          label="Last updated"
          value={formatClientDate(
            document.updatedAt,
          )}
        />
      </div>

      {document.description && (
        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
            Description
          </p>

          <p className="mt-2 leading-7 text-slate-700">
            {document.description}
          </p>
        </div>
      )}

      {document.reviewNotes && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-700">
            Review notes
          </p>

          <p className="mt-2 leading-7 text-blue-950">
            {document.reviewNotes}
          </p>
        </div>
      )}

      <div className="mt-7 border-t border-slate-200 pt-7">
        <h3 className="font-bold text-slate-950">
          Current file
        </h3>

        {currentVersion ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-5">
            <p className="break-all font-bold text-slate-950">
              {currentVersion.originalFileName}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {formatFileSize(
                currentVersion.fileSizeBytes,
              )}
              {" - "}
              {currentVersion.mimeType}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Uploaded{" "}
              {formatClientDate(
                currentVersion.uploadedAt,
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton
                icon={ExternalLink}
                label="Preview"
                disabled={saving}
                onClick={onPreview}
              />

              <ActionButton
                icon={Download}
                label="Download"
                disabled={saving}
                onClick={onDownload}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No file version has been uploaded.
          </p>
        )}
      </div>

      <div className="mt-7 grid gap-4 border-t border-slate-200 pt-7 sm:grid-cols-3">
        <SummaryItem
          label="Versions"
          value={versions.length}
        />

        <SummaryItem
          label="Notes"
          value={notes.length}
        />

        <SummaryItem
          label="Activity entries"
          value={activity.length}
        />
      </div>

      {(canUpdate ||
        canArchive) && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-7">
          {!archived &&
            canUpdate &&
            document.currentVersionNumber >
              0 &&
            ![
              "under_review",
              "approved",
            ].includes(
              document.status,
            ) && (
              <ActionButton
                icon={Clock3}
                label="Submit for review"
                disabled={saving}
                onClick={
                  onSubmitForReview
                }
              />
            )}

          {!archived &&
            canUpdate &&
            document.status ===
              "under_review" && (
              <>
                <ActionButton
                  icon={CheckCircle2}
                  label="Approve"
                  disabled={saving}
                  onClick={onApprove}
                />

                <ActionButton
                  icon={XCircle}
                  label="Reject"
                  disabled={saving}
                  onClick={onReject}
                  danger
                />
              </>
            )}

          {!archived &&
            canArchive && (
              <ActionButton
                icon={Archive}
                label="Archive"
                disabled={saving}
                onClick={onArchive}
                danger
              />
            )}

          {archived &&
            canArchive && (
              <ActionButton
                icon={RotateCcw}
                label="Restore"
                disabled={saving}
                onClick={onRestore}
              />
            )}
        </div>
      )}
    </section>
  );
}

function UploadDocumentDialog({
  saving,
  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    EMPTY_UPLOAD_FORM,
  );

  const [
    validationError,
    setValidationError,
  ] = useState("");

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setValidationError("");
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      setValidationError(
        "Document title is required.",
      );

      return;
    }

    if (!form.file) {
      setValidationError(
        "Select a document file.",
      );

      return;
    }

    if (
      form.effectiveDate &&
      form.expirationDate &&
      form.expirationDate <
        form.effectiveDate
    ) {
      setValidationError(
        "Expiration date cannot be earlier than the effective date.",
      );

      return;
    }

    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close upload dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Upload client document
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Create a document record and upload its initial private
              version.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-6 p-6 sm:p-8">
          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {validationError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Document title"
              value={form.title}
              required
              onChange={(value) => {
                updateField(
                  "title",
                  value,
                );
              }}
            />

            <SelectField
              label="Document type"
              value={
                form.documentType
              }
              options={
                DOCUMENT_TYPES.filter(
                  (option) =>
                    option.value !==
                    "all",
                )
              }
              onChange={(value) => {
                updateField(
                  "documentType",
                  value,
                );
              }}
            />

            <TextField
              label="Effective date"
              type="date"
              value={
                form.effectiveDate
              }
              onChange={(value) => {
                updateField(
                  "effectiveDate",
                  value,
                );
              }}
            />

            <TextField
              label="Expiration date"
              type="date"
              value={
                form.expirationDate
              }
              onChange={(value) => {
                updateField(
                  "expirationDate",
                  value,
                );
              }}
            />
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Description
            </span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => {
                updateField(
                  "description",
                  event.target.value,
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="font-semibold text-slate-800">
              Required document
            </span>

            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(event) => {
                updateField(
                  "isRequired",
                  event.target.checked,
                );
              }}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Document file *
            </span>

            <span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center hover:border-blue-400 hover:bg-blue-50">
              <Upload
                size={25}
                className="text-blue-600"
              />

              <span className="mt-3 font-bold text-slate-900">
                {form.file
                  ? form.file.name
                  : "Select a file"}
              </span>

              <span className="mt-1 text-xs text-slate-500">
                PDF, Word, Excel, JPEG, or PNG. Maximum 25 MB.
              </span>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(event) => {
                  updateField(
                    "file",
                    event.target
                      .files?.[0] ??
                      null,
                  );
                }}
              />
            </span>
          </label>

          <TextField
            label="Version summary"
            value={
              form.changeSummary
            }
            onChange={(value) => {
              updateField(
                "changeSummary",
                value,
              );
            }}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Upload size={18} />
              )}

              Upload document
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewDialog({
  mode,
  saving,
  onClose,
  onSubmit,
}) {
  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    validationError,
    setValidationError,
  ] = useState("");

  function handleSubmit() {
    if (
      mode === "reject" &&
      !notes.trim()
    ) {
      setValidationError(
        "Rejection notes are required.",
      );

      return;
    }

    onSubmit(notes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close review dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-2xl font-bold text-slate-950">
          {mode === "approve"
            ? "Approve document"
            : "Reject document"}
        </h2>

        <p className="mt-2 leading-7 text-slate-600">
          {mode === "approve"
            ? "Record optional approval notes before completing review."
            : "Explain why the document is being rejected."}
        </p>

        {validationError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {validationError}
          </div>
        )}

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">
            Review notes
          </span>

          <textarea
            rows={5}
            value={notes}
            onChange={(event) => {
              setNotes(
                event.target.value,
              );

              setValidationError("");
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className={[
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-bold text-white disabled:bg-slate-300",
              mode === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700",
            ].join(" ")}
          >
            {saving && (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            )}

            {mode === "approve"
              ? "Approve"
              : "Reject"}
          </button>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon
        size={22}
        className="text-blue-600"
      />

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function DetailItem({
  label,
  value,
  warning = false,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p
        className={[
          "mt-2 font-semibold",
          warning
            ? "text-amber-700"
            : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className="text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <LoaderCircle
        size={30}
        className="animate-spin text-blue-600"
      />
    </div>
  );
}

function EmptyState({
  canUpload,
  onUpload,
}) {
  return (
    <div className="p-12 text-center">
      <FileText
        size={42}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        No documents found
      </h2>

      <p className="mt-2 text-slate-600">
        Upload the first client document or adjust the filters.
      </p>

      {canUpload && (
        <button
          type="button"
          onClick={onUpload}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
        >
          <FilePlus2 size={17} />
          Upload first document
        </button>
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition disabled:opacity-50",
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-slate-300 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function MessagePanel({
  icon: Icon,
  tone,
  title,
  message,
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-2xl border p-5",
        classes,
      ].join(" ")}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
      />

      <div>
        <p className="font-bold">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6">
          {message}
        </p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  type = "text",
  required = false,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required
          ? " *"
          : ""}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        className={[
          inputClassName,
          "mt-2",
        ].join(" ")}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        className={[
          inputClassName,
          "mt-2",
        ].join(" ")}
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
].join(" ");

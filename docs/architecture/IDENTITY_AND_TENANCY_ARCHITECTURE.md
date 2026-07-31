# Let's WorkLynk Identity and Tenancy Architecture

## Platform Model

Let's WorkLynk is a nationwide, multi-tenant workforce marketplace.

The platform supports:

1. Platform operator organizations
2. Client organizations
3. Contractor organizations
4. Independent users acting through organization memberships

A user may belong to more than one organization.

## Identity Boundary

Authentication identifies the human user.

Organization membership determines where the user may operate.

Roles and permissions determine what the user may do inside each organization.

Authentication alone never grants access to tenant-owned data.

## Organization Categories

### Platform Operator

Represents Let's WorkLynk and its authorized administrative users.

Responsibilities include:

- Marketplace governance
- Organization verification
- Compliance oversight
- Dispute administration
- Payment operations
- Platform configuration
- Security administration

### Client Organization

Represents a business purchasing independent contractor services.

Capabilities include:

- Organization profile management
- Facilities and departments
- Job and shift publishing
- Contractor discovery
- Proposals and negotiations
- Agreements and assignments
- Time approval
- Invoices and payments
- Reviews

### Contractor Organization

Represents an individual contractor or contractor-owned business.

Capabilities include:

- Business profile
- Service offerings
- Rate cards
- Credentials
- Availability
- Proposals
- Negotiations
- Agreements
- Assignments
- Time submission
- Invoices
- Payments
- Reviews

## Membership Model

A user may hold one or more organization memberships.

Each membership contains:

- Organization
- User
- Membership status
- Invitation status
- Join date
- Suspension state
- Audit metadata

## Authorization Model

Permissions are resolved through:

- Membership roles
- Role permissions
- User permission overrides
- Platform administrator privileges
- Organization lifecycle status
- Membership lifecycle status

## Data Isolation

Every tenant-owned business record must contain an organization boundary.

Row-Level Security must ensure:

- Client organizations cannot access another client's private records.
- Contractor organizations cannot access another contractor's private records.
- Public marketplace records expose only approved fields.
- Platform administrators receive controlled administrative access.
- Suspended or revoked memberships lose tenant access immediately.

## Audit Requirements

Security-sensitive and marketplace-critical changes must retain:

- Created timestamp
- Created actor
- Updated timestamp
- Updated actor
- Archived timestamp
- Archived actor
- Soft-deletion timestamp where supported
- State-transition history where required

## Initial Foundation Tables

The initial identity migration will create:

- profiles
- organizations
- organization_memberships
- roles
- permissions
- role_permissions
- membership_roles
- user_permission_overrides
- platform_administrators

## Organization Lifecycle

Supported organization states:

- pending
- active
- suspended
- rejected
- archived

## Membership Lifecycle

Supported membership states:

- invited
- active
- suspended
- revoked
- archived

## Security Principle

No business module may create an independent tenant-security model.

Every marketplace module must use the central identity, tenancy, role, permission, audit, and Row-Level Security foundation.

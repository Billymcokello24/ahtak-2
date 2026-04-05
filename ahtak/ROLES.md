# Role-Based Access Control

AHTTAK Membership System supports four user roles. Each user has a **UserProfile** with a role; the `member` role additionally links to a **Member** record for self-service.

---

## Role Definitions

| Role | Description | Access |
|------|-------------|--------|
| **Super Admin** | Full system control | Everything: all modules, all data, user management (admin) |
| **Admin / Accountant** | Day-to-day operations | Members, events, payments, savings, contributions, reports, check-in, dashboard |
| **Loan Officer** | Operations (read-focused) | Members (read), savings & contributions (read), events (read), dashboard |
| **Member** | Self-service only | Own profile, own savings/contributions, event registration, own documents |

---

## Detailed Permissions by Role

### Super Admin
- Full access to Django Admin and all APIs
- Can manage users, roles, and all data
- No restrictions

### Admin / Accountant
| Resource | List | Create | Update | Delete | Actions |
|----------|------|--------|--------|--------|---------|
| Members | ✓ | ✓ | ✓ | ✓ | Approve, ID card PDF, document upload |
| Membership types | ✓ | ✓ | ✓ | ✓ | |
| Events | ✓ | ✓ | ✓ | ✓ | |
| Event registrations | ✓ | ✓ | ✓ | ✓ | Check-in |
| Payments | ✓ | ✓ | ✓ | ✓ | Receipt PDF, email receipt |
| Savings | ✓ | ✓ | ✓ | ✓ | |
| Contributions | ✓ | ✓ | ✓ | ✓ | |
| Reports | ✓ | – | – | – | Download Excel/PDF |
| Dashboard | ✓ | – | – | – | View KPIs |

### Loan Officer
| Resource | List | Create | Update | Delete | Notes |
|----------|------|--------|--------|--------|-------|
| Members | ✓ | – | – | – | Read-only |
| Membership types | ✓ | – | – | – | Read-only |
| Events | ✓ | – | – | – | Read-only |
| Payments | ✓ | – | – | – | Read-only |
| Savings | ✓ | – | – | – | Read-only |
| Contributions | ✓ | – | – | – | Read-only |
| Reports | ✓ | – | – | – | Read-only |
| Dashboard | ✓ | – | – | – | View KPIs |

### Member
| Resource | Access | Notes |
|----------|--------|-------|
| Own profile | Full | `/members/{own_id}` – view, update, upload documents |
| Own savings | Read | Only own accounts |
| Own contributions | Read | View own contribution status |
| Events | Read + register | Browse events, register (as self) |
| Dashboard | Read | Limited to own summary |

Members cannot:
- See other members
- Record payments
- Approve members
- Access reports
- Check in attendees
- Manage membership types

---

## Assigning Roles

1. **Django Admin**: Go to `http://127.0.0.1:8000/admin/core/userprofile/`
2. Create or edit a **User**. Create a **UserProfile** for that user.
3. Set **Role** (super_admin, admin, loan_officer, member).
4. For **Member** role: link **Member** to the profile so the user can access their own data.

**New users**: The `create_user_profile` signal creates a UserProfile with role `admin` by default. Change it in Admin as needed.

---

## Frontend Behavior

The sidebar navigation is filtered by role:

- **Super Admin / Admin**: Full nav (Dashboard, Members, Events, Check-in, Payments, Savings, Contributions, Reports)
- **Loan Officer**: Same as Admin (all visible; backend enforces write restrictions)
- **Member**: Dashboard, My account, Events, Contributions (limited views)

---

## API Behavior

- **Token auth**: All roles use the same `POST /api/auth/token/` flow.
- **Permission checks**: ViewSets use `RoleRequired` and `IsMemberOwner` to enforce access.
- **Member role**: Querysets are filtered server-side so members see only their own records.

import { useState } from "react";

export default function AdminManagement({
  users,
  onCreateUser,
}) {
  const inspectorCount = users.filter(
    (user) => user.role === "Field Inspector"
  ).length;

  const citizenCount = users.filter(
    (user) => user.role === "Citizen"
  ).length;

  const administratorCount = users.filter(
    (user) => user.role === "Administrator"
  ).length;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Citizen",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }

    if (formSuccess) {
      setFormSuccess("");
    }
  }

  async function createAccount(event) {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !form.password
    ) {
      setFormError(
        "Please complete all account fields."
      );
      return;
    }

    if (form.password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setCreatingAccount(true);

    try {
      const created = await onCreateUser({
        ...form,
        firstName,
        lastName,
        email,
        birthday: "",
        mobile: "",
        address: {
          houseNumber: "",
          street: "",
          barangay: "",
          city: "",
        },
      });

      if (!created) {
        return;
      }

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Citizen",
      });

      setFormSuccess(
        "Account created successfully."
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  return (
    <main className="main">
      <p className="eyebrow">
        ADMINISTRATION
      </p>

      <h1>Administrator</h1>

      <p className="subtitle">
        Manage user accounts and create new
        RoadWatch accounts.
      </p>

      <section
        className="stats admin-management-stats"
        aria-label="User account statistics"
      >
        <div>
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div>
          <span>Citizens</span>
          <strong>{citizenCount}</strong>
        </div>

        <div>
          <span>Inspectors</span>
          <strong>{inspectorCount}</strong>
        </div>

        <div>
          <span>Administrators</span>
          <strong>{administratorCount}</strong>
        </div>
      </section>

      <section
        className="panel"
        aria-labelledby="create-account-heading"
      >
        <h2 id="create-account-heading">
          Create Account
        </h2>

        <form
          className="form admin-account-form"
          onSubmit={createAccount}
        >
          <div className="two-column">
            <div>
              <label htmlFor="admin-first-name">
                First Name
              </label>

              <input
                id="admin-first-name"
                name="firstName"
                type="text"
                value={form.firstName}
                autoComplete="given-name"
                required
                disabled={creatingAccount}
                onChange={(event) =>
                  updateField(
                    "firstName",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="admin-last-name">
                Last Name
              </label>

              <input
                id="admin-last-name"
                name="lastName"
                type="text"
                value={form.lastName}
                autoComplete="family-name"
                required
                disabled={creatingAccount}
                onChange={(event) =>
                  updateField(
                    "lastName",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="admin-email">
                Email
              </label>

              <input
                id="admin-email"
                name="email"
                type="email"
                value={form.email}
                autoComplete="email"
                required
                disabled={creatingAccount}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="admin-password">
                Password
              </label>

              <input
                id="admin-password"
                name="password"
                type="password"
                value={form.password}
                autoComplete="new-password"
                required
                minLength={6}
                disabled={creatingAccount}
                aria-describedby="admin-password-help"
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
              />

              <small id="admin-password-help">
                Password must contain at least 6
                characters.
              </small>
            </div>

            <div>
              <label htmlFor="admin-role">
                Role
              </label>

              <select
                id="admin-role"
                name="role"
                value={form.role}
                disabled={creatingAccount}
                onChange={(event) =>
                  updateField(
                    "role",
                    event.target.value
                  )
                }
              >
                <option value="Citizen">
                  Citizen
                </option>

                <option value="Field Inspector">
                  Field Inspector
                </option>

                <option value="Administrator">
                  Administrator
                </option>
              </select>
            </div>
          </div>

          {formError && (
            <div
              className="login-error admin-form-error"
              role="alert"
              aria-live="assertive"
            >
              <span
                className="login-error-icon"
                aria-hidden="true"
              >
                ⚠
              </span>

              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div
              className="admin-form-success"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true">
                ✓
              </span>

              <span>{formSuccess}</span>
            </div>
          )}

          <button
            className="gold"
            type="submit"
            disabled={creatingAccount}
          >
            {creatingAccount
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>
      </section>

      <section
        className="panel"
        aria-labelledby="user-management-heading"
      >
        <h2 id="user-management-heading">
          User Management
        </h2>

        <div className="table-container">
          <table className="table">
            <caption className="sr-only">
              RoadWatch user accounts
            </caption>

            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
              </tr>
            </thead>

            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.email}>
                    <td>
                      {user.firstName}{" "}
                      {user.lastName}
                    </td>

                    <td>{user.email}</td>

                    <td>{user.role}</td>

                    <td>Active</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
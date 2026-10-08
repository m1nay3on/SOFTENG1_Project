import { useState } from "react";
import FeedbackMessage from "../../components/FeedbackMessage";

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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Citizen",
  });
  const [feedback, setFeedback] = useState({ message: "", type: "error" });

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFeedback({ message: "", type: "error" });
  }

  async function createAccount(event) {
    event.preventDefault();

    if (![form.firstName, form.lastName, form.email].every((value) => value.trim())) {
      setFeedback({ message: "Enter a name and email address without leaving the fields blank.", type: "error" });
      return;
    }

    if (form.password.length < 6) {
      setFeedback({ message: "Password must contain at least 6 characters.", type: "error" });
      return;
    }

    const created = await onCreateUser({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      birthday: "",
      mobile: "",
      address: {
        houseNumber: "",
        street: "",
        barangay: "",
        city: "",
      },
    });

    if (created) {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Citizen",
      });
      setFeedback({ message: "Account created successfully.", type: "success" });
    }
  }

  return (
    <main className="main">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Administrator</h1>
      <p className="subtitle">
        Manage user accounts and create new
        RoadWatch accounts.
      </p>

      <section className="stats admin-management-stats">
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
          <strong>
            {users.filter(
              (user) => user.role === "Administrator"
            ).length}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>Create Account</h2>

        <form className="form admin-account-form" onSubmit={createAccount}>
          <FeedbackMessage
            message={feedback.message}
            type={feedback.type}
            onDismiss={() => setFeedback({ message: "", type: "error" })}
          />
          <div className="two-column">
            <label>
              First Name
              <input
                type="text"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) =>
                  updateField("firstName", e.target.value)
                }
              />
            </label>

            <label>
              Last Name
              <input
                type="text"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={(e) =>
                  updateField("lastName", e.target.value)
                }
              />
            </label>

            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) =>
                  updateField("password", e.target.value)
                }
              />
            </label>

            <label>
              Role
              <select
                value={form.role}
                onChange={(e) =>
                  updateField("role", e.target.value)
                }
              >
                <option>Citizen</option>
                <option>Field Inspector</option>
                <option>Administrator</option>
              </select>
            </label>
          </div>

          <button className="gold" type="submit">
            Create Account
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>User Management</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

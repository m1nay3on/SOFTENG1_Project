import { useState } from "react";
import logo from "../../assets/roadwatch-logo.png";
import { calculateAge } from "../../data/defaultData";

export default function Register({
  setAuthPage,
  onRegister,
  setShowMinorModal,
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    mobile: "",
    houseNumber: "",
    street: "",
    barangay: "",
    city: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formError, setFormError] = useState("");

  function updateField(field, value) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  function handleRegister(event) {
    event.preventDefault();
    setFormError("");

    const requiredFields = [
      form.firstName,
      form.lastName,
      form.birthday,
      form.mobile,
      form.houseNumber,
      form.street,
      form.barangay,
      form.city,
      form.email,
      form.password,
      form.confirmPassword,
    ];

    const hasEmptyField = requiredFields.some(
      (value) => !value.trim()
    );

    if (hasEmptyField) {
      setFormError("Please complete all required fields.");
      return;
    }

    const age = calculateAge(form.birthday);

    if (age < 18) {
      setShowMinorModal(true);
      return;
    }

    if (form.password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const newUser = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthday: form.birthday,
      mobile: form.mobile.trim(),

      address: {
        houseNumber: form.houseNumber.trim(),
        street: form.street.trim(),
        barangay: form.barangay.trim(),
        city: form.city.trim(),
      },

      email: form.email.trim(),
      password: form.password,
      role: "Citizen",
    };

    onRegister(newUser);
  }

  return (
    <main className="auth-page">
      <div className="auth-card register-card">
        <div className="register-header">
          <img
            src={logo}
            alt="RoadWatch Logo"
            className="auth-logo"
          />

          <h1>Create Account</h1>

          <p className="auth-subtitle">
            Join RoadWatch and help monitor your community.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          {/* PERSONAL INFORMATION */}

          <section
            className="register-section"
            aria-labelledby="personal-information-heading"
          >
            <h2
              id="personal-information-heading"
              className="register-section-title"
            >
              Personal Information
            </h2>

            <div className="two-column">
              <label>
                First Name

                <input
                  name="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField(
                      "firstName",
                      event.target.value
                    )
                  }
                  autoComplete="given-name"
                  required
                />
              </label>

              <label>
                Last Name

                <input
                  name="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField(
                      "lastName",
                      event.target.value
                    )
                  }
                  autoComplete="family-name"
                  required
                />
              </label>

              <label>
                Birthday

                <input
                  name="birthday"
                  type="date"
                  value={form.birthday}
                  onChange={(event) =>
                    updateField(
                      "birthday",
                      event.target.value
                    )
                  }
                  autoComplete="bday"
                  required
                />
              </label>

              <label>
                Mobile Number

                <input
                  name="mobile"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={form.mobile}
                  onChange={(event) =>
                    updateField(
                      "mobile",
                      event.target.value
                    )
                  }
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </label>
            </div>
          </section>

          {/* ADDRESS */}

          <section
            className="register-section"
            aria-labelledby="address-heading"
          >
            <h2
              id="address-heading"
              className="register-section-title"
            >
              Address
            </h2>

            <div className="address-grid">
              <label>
                House No.

                <input
                  name="houseNumber"
                  type="text"
                  placeholder="House no."
                  value={form.houseNumber}
                  onChange={(event) =>
                    updateField(
                      "houseNumber",
                      event.target.value
                    )
                  }
                  autoComplete="address-line1"
                  required
                />
              </label>

              <label>
                Street

                <input
                  name="street"
                  type="text"
                  placeholder="Street"
                  value={form.street}
                  onChange={(event) =>
                    updateField(
                      "street",
                      event.target.value
                    )
                  }
                  autoComplete="address-line2"
                  required
                />
              </label>

              <label>
                Barangay

                <input
                  name="barangay"
                  type="text"
                  placeholder="Barangay"
                  value={form.barangay}
                  onChange={(event) =>
                    updateField(
                      "barangay",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                City

                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(event) =>
                    updateField(
                      "city",
                      event.target.value
                    )
                  }
                  autoComplete="address-level2"
                  required
                />
              </label>
            </div>
          </section>

          {/* ACCOUNT INFORMATION */}

          <section
            className="register-section"
            aria-labelledby="account-information-heading"
          >
            <h2
              id="account-information-heading"
              className="register-section-title"
            >
              Account Information
            </h2>

            <div className="two-column">
              <label>
                Email Address

                <input
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password

                <input
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <label>
                Confirm Password

                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
            </div>
          </section>

          {formError && (
            <div
              className="login-error register-error"
              role="alert"
              aria-live="polite"
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

          <button
            type="submit"
            className="gold auth-submit"
          >
            Create Account
          </button>
        </form>

        <button
          type="button"
          className="link-btn register-back"
          onClick={() => setAuthPage("login")}
        >
          ← Back to Login
        </button>
      </div>
    </main>
  );
}
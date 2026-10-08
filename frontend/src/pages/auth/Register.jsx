import { useState } from "react";
import logo from "../../assets/roadwatch-logo.png";
import { calculateAge } from "../../data/defaultData";
import FeedbackMessage from "../../components/FeedbackMessage";
export default function Register({
  setAuthPage,
  onRegister,
  setShowMinorModal,
  feedback,
  onDismissFeedback,
}) {
  const [validationMessage, setValidationMessage] = useState("");
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const maxBirthday = today.toISOString().slice(0, 10);
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

  function updateField(field, value) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));
    setValidationMessage("");
    onDismissFeedback();
  }

  function handleRegister(event) {
    event.preventDefault();
    const requiredTextFields = [
      form.firstName,
      form.lastName,
      form.mobile,
      form.houseNumber,
      form.street,
      form.barangay,
      form.city,
      form.email,
    ];
    if (requiredTextFields.some((value) => !value.trim())) {
      setValidationMessage("Complete all required fields. Spaces alone do not count.");
      return;
    }

    const age = calculateAge(
      form.birthday
    );

    if (age < 0) {
      setValidationMessage("Birthday cannot be in the future.");
      return;
    }

    if (age < 18) {
      setShowMinorModal(true);
      return;
    }

    if (form.password.length < 6) {
      setValidationMessage("Password must contain at least 6 characters.");
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setValidationMessage("Passwords do not match.");
      return;
    }

    const newUser = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthday: form.birthday,
      mobile: form.mobile.trim(),

      address: {
        houseNumber:
        form.houseNumber.trim(),
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
            Join RoadWatch and help monitor
            your community.
          </p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
        <FeedbackMessage
          message={validationMessage}
          onDismiss={() => setValidationMessage("")}
        />
        <FeedbackMessage
          message={feedback}
          onDismiss={onDismissFeedback}
        />

        {/* PERSONAL INFORMATION */}

        <div className="register-section">
          <h3>
            Personal Information
          </h3>

          <div className="two-column">
            <label>
              First Name

              <input
                type="text"
                autoComplete="given-name"
                required
                placeholder="Enter first name"
                value={form.firstName}
                onChange={(e) =>
                  updateField(
                    "firstName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Last Name

              <input
                type="text"
                autoComplete="family-name"
                required
                placeholder="Enter last name"
                value={form.lastName}
                onChange={(e) =>
                  updateField(
                    "lastName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Birthday

              <input
                type="date"
                autoComplete="bday"
                max={maxBirthday}
                required
                value={form.birthday}
                onChange={(e) =>
                  updateField(
                    "birthday",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Mobile Number

              <input
                type="tel"
                autoComplete="tel"
                pattern="[0-9+() -]{7,20}"
                required
                placeholder="09XXXXXXXXX"
                value={form.mobile}
                onChange={(e) =>
                  updateField(
                    "mobile",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        {/* ADDRESS */}

        <div className="register-section">
          <h3>Address</h3>

          <div className="address-grid">
            <label>
              House No.

              <input
                type="text"
                autoComplete="address-line1"
                required
                placeholder="House no."
                value={
                  form.houseNumber
                }
                onChange={(e) =>
                  updateField(
                    "houseNumber",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Street

              <input
                type="text"
                autoComplete="address-line2"
                required
                placeholder="Street"
                value={form.street}
                onChange={(e) =>
                  updateField(
                    "street",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Barangay

              <input
                type="text"
                autoComplete="address-level3"
                required
                placeholder="Barangay"
                value={form.barangay}
                onChange={(e) =>
                  updateField(
                    "barangay",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              City

              <input
                type="text"
                autoComplete="address-level2"
                required
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        {/* ACCOUNT INFORMATION */}

        <div className="register-section">
          <h3>
            Account Information
          </h3>

          <div className="two-column">
            <label>
              Email Address

              <input
                type="email"
                autoComplete="email"
                required
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Password

              <input
                type="password"
                autoComplete="new-password"
                required
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) =>
                  updateField(
                    "password",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Confirm Password

              <input
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm password"
                value={
                  form.confirmPassword
                }
                onChange={(e) =>
                  updateField(
                    "confirmPassword",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        {/* CREATE ACCOUNT */}

        <button className="gold auth-submit" type="submit">
          Create Account
        </button>
        </form>

        {/* BACK TO LOGIN */}

        <button
          className="link-btn register-back"
          type="button"
          onClick={() =>
            setAuthPage("login")
          }
        >
          ← Back to Login
        </button>

      </div>
    </main>
  );
}

/* =========================================================
   CITIZEN DASHBOARD
========================================================= */

import React, { useEffect, useState } from "react";
import "./Customers.css";

const API = "http://localhost:5000/api/customers";

const Customers = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  // =====================================================
  // LOAD CUSTOMERS
  // GET /api/customers
  // =====================================================

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load customers"
        );
      }

      setCustomers(
        data?.customers ||
          data?.data ||
          []
      );
    } catch (err) {
      console.error("Customers Error:", err);

      setError(
        err.message ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CUSTOMERS ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile number - only numbers
    if (name === "phone") {
      const onlyNumbers = value.replace(
        /\D/g,
        ""
      );

      setFormData((previous) => ({
        ...previous,
        phone: onlyNumbers.slice(0, 15),
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN FORM
  // =====================================================

  const openForm = () => {
    setError("");
    setSuccess("");

    setFormData({
      name: "",
      phone: "",
    });

    setShowForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);

    setFormData({
      name: "",
      phone: "",
    });

    setError("");
  };

  // =====================================================
  // CREATE CUSTOMER
  // POST /api/customers
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const name = formData.name.trim();
      const mobile = formData.phone.trim();

      // -------------------------------------------------
      // FRONTEND VALIDATION
      // -------------------------------------------------

      if (!name) {
        throw new Error(
          "Customer name is required"
        );
      }

      if (!mobile) {
        throw new Error(
          "Mobile number is required"
        );
      }

      if (mobile.length < 10) {
        throw new Error(
          "Please enter a valid mobile number"
        );
      }

      const token = getToken();

      // -------------------------------------------------
      // IMPORTANT
      // Backend expects `mobile`
      // -------------------------------------------------

      const customerPayload = {
        name,
        mobile,
      };

      console.log(
        "Creating customer:",
        customerPayload
      );

      const response = await fetch(API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        body: JSON.stringify(
          customerPayload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create customer"
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      setSuccess(
        data?.message ||
          "Customer added successfully"
      );

      setFormData({
        name: "",
        phone: "",
      });

      setShowForm(false);

      // Reload customer list
      await loadCustomers();
    } catch (err) {
      console.error(
        "Create Customer Error:",
        err
      );

      setError(
        err.message ||
          "Failed to create customer"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customers-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="customers-header">

        <div>
          <h1>Customers</h1>

          <p>
            Manage your Chashma Plus
            customers.
          </p>
        </div>

        <button
          type="button"
          className="add-customer-btn"
          onClick={openForm}
        >
          + Add Customer
        </button>

      </div>

      {/* =================================================
          SUCCESS MESSAGE
          ================================================= */}

      {success && (
        <div className="customers-success">
          {success}
        </div>
      )}

      {/* =================================================
          ERROR MESSAGE
          ================================================= */}

      {error && (
        <div className="customers-error">
          {error}
        </div>
      )}

      {/* =================================================
          ADD CUSTOMER FORM
          ================================================= */}

      {showForm && (
        <div className="customer-form-card">

          {/* FORM HEADER */}

          <div className="form-header">

            <div>
              <h2>Add Customer</h2>

              <p>
                Enter customer details
                below.
              </p>
            </div>

            <button
              type="button"
              className="close-form-btn"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close form"
            >
              ×
            </button>

          </div>

          {/* FORM */}

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              {/* CUSTOMER NAME */}

              <div className="form-group">

                <label htmlFor="customer-name">
                  Customer Name
                </label>

                <input
                  id="customer-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  autoComplete="name"
                  required
                  disabled={saving}
                />

              </div>

              {/* MOBILE NUMBER */}

              <div className="form-group">

                <label htmlFor="customer-phone">
                  Mobile Number
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={15}
                  required
                  disabled={saving}
                />

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Customer"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          CUSTOMER LIST
          ================================================= */}

      <div className="customers-card">

        {/* LIST HEADER */}

        <div className="customers-card-header">

          <div>

            <h2>
              Customer List
            </h2>

            <p>
              {customers.length} customer
              {customers.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <button
            type="button"
            className="refresh-customers-btn"
            onClick={loadCustomers}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

        {/* =================================================
            LOADING
            ================================================= */}

        {loading ? (
          <div className="customers-empty">

            <div className="empty-icon">
              ⟳
            </div>

            <h3>
              Loading Customers
            </h3>

            <p>
              Please wait while
              customers are loaded.
            </p>

          </div>

        ) : customers.length === 0 ? (

          /* =================================================
             EMPTY STATE
             ================================================= */

          <div className="customers-empty">

            <div className="empty-icon">
              ♟
            </div>

            <h3>
              No Customers Found
            </h3>

            <p>
              Add your first customer
              to get started.
            </p>

            <button
              type="button"
              onClick={openForm}
              className="empty-add-btn"
            >
              + Add Customer
            </button>

          </div>

        ) : (

          /* =================================================
             CUSTOMER TABLE
             ================================================= */

          <div className="table-wrapper">

            <table className="customers-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile Number</th>
                </tr>

              </thead>

              <tbody>

                {customers.map(
                  (customer, index) => (
                    <tr
                      key={
                        customer.id ||
                        customer.customer_id ||
                        index
                      }
                    >

                      {/* NUMBER */}

                      <td>
                        {index + 1}
                      </td>

                      {/* NAME */}

                      <td className="customer-name">
                        {customer.name ||
                          customer.customer_name ||
                          "-"}
                      </td>

                      {/* MOBILE */}

                      <td>
                        {customer.mobile ||
                          customer.phone ||
                          customer.phone_number ||
                          customer.mobile_number ||
                          "-"}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default Customers;
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Plus,
  Search,
  UserRound,
  Save,
  X,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Phone,
  FileText,
  Glasses,
  PackagePlus,
} from "lucide-react";

import "./EyeTesting.css";

import {
  getEyeTests,
  getCustomersForEyeTest,
  getLensTypes,
  getFramesForEyeTest,
  createManualFrame,
  createEyeTest,
  updateEyeTest,
  deleteEyeTest,
} from "../services/eyeTestService.js";


// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  customer_id: "",

  right_sph: "",
  right_cyl: "",
  right_axis: "",
  right_add: "",
  right_pd: "",

  left_sph: "",
  left_cyl: "",
  left_axis: "",
  left_add: "",
  left_pd: "",

  lens_type_id: "",
  lens_type_name: "",
  lens_price: "",

  frame_product_id: "",
  frame_name: "",
  frame_price: "",

  test_date: new Date()
    .toISOString()
    .split("T")[0],

  notes: "",
};


// =====================================================
// EMPTY MANUAL FRAME
// =====================================================

const emptyManualFrame = {
  product_name: "",
  product_image: "",
  shop_location: "Arjunganj",
  description: "",
  low_stock_limit: "5",
  initial_stock: "0",
  purchase_price: "",
  selling_price: "",
};


// =====================================================
// ARRAY NORMALIZER
// =====================================================

const getArray = (
  response,
  keys = []
) => {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (
      Array.isArray(
        response?.[key]
      )
    ) {
      return response[key];
    }

    if (
      Array.isArray(
        response?.data?.[key]
      )
    ) {
      return response.data[key];
    }
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
};


// =====================================================
// CUSTOMER HELPERS
// =====================================================

const getCustomerId = (
  customer
) => {
  return (
    customer?.id ??
    customer?.customer_id ??
    customer?.CustomerID ??
    ""
  );
};


const getCustomerName = (
  customer
) => {
  return (
    customer?.name ??
    customer?.customer_name ??
    customer?.CustomerName ??
    customer?.FullName ??
    "Unknown Customer"
  );
};


const getCustomerMobile = (
  customer
) => {
  return (
    customer?.mobile ??
    customer?.customer_mobile ??
    customer?.MobileNumber ??
    "-"
  );
};


// =====================================================
// TEST HELPERS
// =====================================================

const getEyeTestId = (
  test
) => {
  return (
    test?.id ??
    test?.eye_test_id ??
    test?.EyeTestID ??
    ""
  );
};


const getTestCustomerId = (
  test
) => {
  return (
    test?.customer_id ??
    test?.CustomerID ??
    ""
  );
};


const getTestCustomerName = (
  test
) => {
  return (
    test?.customer_name ??
    test?.CustomerName ??
    "Unknown Customer"
  );
};


const getTestCustomerMobile = (
  test
) => {
  return (
    test?.customer_mobile ??
    test?.MobileNumber ??
    "-"
  );
};


// =====================================================
// FRAME HELPERS
// =====================================================

const getFrameId = (
  frame
) => {
  return (
    frame?.id ??
    frame?.product_id ??
    ""
  );
};


const getFrameName = (
  frame
) => {
  return (
    frame?.product_name ??
    frame?.name ??
    "Unnamed Frame"
  );
};


const getFramePrice = (
  frame
) => {
  const value =
    frame?.selling_price ??
    frame?.sellingPrice ??
    frame?.price ??
    frame?.frame_price ??
    0;

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};


// =====================================================
// DATE
// =====================================================

const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


// =====================================================
// NUMBER DISPLAY
// =====================================================

const displayValue = (
  value,
  fallback = "0.00"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return value;
};


// =====================================================
// COMPONENT
// =====================================================

const EyeTesting = () => {
  const [tests, setTests] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [lensTypes, setLensTypes] =
    useState([]);

  const [frames, setFrames] =
    useState([]);


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState({
      ...emptyForm,
    });

  const [
    manualFrame,
    setManualFrame,
  ] = useState({
    ...emptyManualFrame,
  });


  // ===================================================
  // UI
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    frameSaving,
    setFrameSaving,
  ] = useState(false);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    showFrameModal,
    setShowFrameModal,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    viewTest,
    setViewTest,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  // ===================================================
  // LOAD CUSTOMERS
  // ===================================================

  const loadCustomers =
    async () => {
      const response =
        await getCustomersForEyeTest();

      const list =
        getArray(
          response,
          ["customers"]
        );

      setCustomers(list);
    };


  // ===================================================
  // LOAD LENS TYPES
  // ===================================================

  const loadLensTypes =
    async () => {
      const response =
        await getLensTypes();

      const list =
        getArray(
          response,
          [
            "lensTypes",
            "lens_types",
          ]
        );

      setLensTypes(list);
    };


  // ===================================================
  // LOAD FRAMES
  // ===================================================

  const loadFrames =
    async () => {
      const response =
        await getFramesForEyeTest();

      const list =
        getArray(
          response,
          ["frames"]
        );

      setFrames(list);
    };


  // ===================================================
  // LOAD TESTS
  // ===================================================

  const loadTests =
    async () => {
      const response =
        await getEyeTests();

      const list =
        getArray(
          response,
          [
            "eyeTests",
            "eye_tests",
            "tests",
          ]
        );

      setTests(list);
    };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const loadAll =
      async () => {
        try {
          setLoading(true);
          setError("");

          await Promise.all([
            loadCustomers(),
            loadLensTypes(),
            loadFrames(),
            loadTests(),
          ]);

        } catch (err) {
          console.error(
            "Eye Testing Load Error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load eye testing data."
          );

        } finally {
          setLoading(false);
        }
      };

    loadAll();
  }, []);


  // ===================================================
  // SEARCH FILTER
  // ===================================================

  const filteredTests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return tests;
      }

      return tests.filter(
        (test) => {
          const values = [
            getTestCustomerName(
              test
            ),
            getTestCustomerMobile(
              test
            ),
            test?.frame_name,
            test?.lens_type,
            test?.test_date,
            test?.notes,
          ];

          return values.some(
            (value) =>
              String(
                value ?? ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      tests,
      search,
    ]);


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {
      const today =
        tests.filter(
          (test) => {
            if (
              !test?.test_date
            ) {
              return false;
            }

            return (
              new Date(
                test.test_date
              ).toDateString() ===
              new Date().toDateString()
            );
          }
        ).length;


      const customerCount =
        new Set(
          tests.map(
            (test) =>
              getTestCustomerId(
                test
              )
          )
        ).size;


      return {
        total:
          tests.length,

        today,

        customers:
          customerCount,
      };
    }, [tests]);


  // ===================================================
  // SELECTED CUSTOMER
  // ===================================================

  const selectedCustomer =
    useMemo(() => {
      return customers.find(
        (customer) =>
          String(
            getCustomerId(
              customer
            )
          ) ===
          String(
            form.customer_id
          )
      );
    }, [
      customers,
      form.customer_id,
    ]);


  // ===================================================
  // SELECTED FRAME
  // ===================================================

  const selectedFrame =
    useMemo(() => {
      return frames.find(
        (frame) =>
          String(
            getFrameId(frame)
          ) ===
          String(
            form.frame_product_id
          )
      );
    }, [
      frames,
      form.frame_product_id,
    ]);


  // ===================================================
  // CUSTOMER LATEST TEST
  // ===================================================

  const customerLatestTest =
    useMemo(() => {
      if (
        !form.customer_id
      ) {
        return null;
      }

      return tests.find(
        (test) =>
          String(
            getTestCustomerId(
              test
            )
          ) ===
          String(
            form.customer_id
          )
      );
    }, [
      tests,
      form.customer_id,
    ]);


  // ===================================================
  // GENERAL CHANGE
  // ===================================================

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // ===================================================
  // CUSTOMER CHANGE
  // ===================================================

  const handleCustomerChange =
    (event) => {
      const customerId =
        event.target.value;

      setForm(
        (previous) => ({
          ...previous,
          customer_id:
            customerId,
        })
      );

      setError("");
    };


  // ===================================================
  // LENS CHANGE
  // ===================================================

  const handleLensTypeChange =
    (event) => {
      const lensId =
        event.target.value;

      const selectedLens =
        lensTypes.find(
          (lens) =>
            String(
              lens?.id
            ) ===
            String(lensId)
        );

      setForm(
        (previous) => ({
          ...previous,

          lens_type_id:
            lensId,

          lens_type_name:
            selectedLens?.name ||
            "",
        })
      );
    };


  // ===================================================
  // FRAME SELECT
  // ===================================================

  const handleFrameChange =
    (event) => {
      const id =
        event.target.value;

      const frame =
        frames.find(
          (item) =>
            String(
              getFrameId(item)
            ) ===
            String(id)
        );

      if (!frame) {
        setForm(
          (previous) => ({
            ...previous,
            frame_product_id:
              "",
            frame_name:
              "",
            frame_price:
              "",
          })
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,

          frame_product_id:
            String(
              getFrameId(frame)
            ),

          frame_name:
            getFrameName(frame),

          frame_price:
            String(
              getFramePrice(
                frame
              )
            ),
        })
      );
    };


  // ===================================================
  // OPEN NEW
  // ===================================================

  const openNewTest =
    () => {
      setEditingId(null);

      setForm({
        ...emptyForm,
      });

      setError("");
      setSuccess("");

      setShowModal(true);
    };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(false);
      setEditingId(null);

      setForm({
        ...emptyForm,
      });
    };


  // ===================================================
  // EDIT
  // ===================================================

  const editTest =
    (test) => {
      const id =
        getEyeTestId(test);

      setEditingId(id);

      setForm({
        customer_id:
          getTestCustomerId(
            test
          ) || "",

        right_sph:
          test?.right_sph ??
          test?.RightSPH ??
          "",

        right_cyl:
          test?.right_cyl ??
          test?.RightCYL ??
          "",

        right_axis:
          test?.right_axis ??
          test?.RightAXIS ??
          "",

        right_add:
          test?.right_add ??
          test?.RightADD ??
          "",

        right_pd:
          test?.right_pd ??
          "",

        left_sph:
          test?.left_sph ??
          test?.LeftSPH ??
          "",

        left_cyl:
          test?.left_cyl ??
          test?.LeftCYL ??
          "",

        left_axis:
          test?.left_axis ??
          test?.LeftAXIS ??
          "",

        left_add:
          test?.left_add ??
          test?.LeftADD ??
          "",

        left_pd:
          test?.left_pd ??
          "",

        lens_type_id:
          test?.lens_type_id ??
          "",

        lens_type_name:
          test?.lens_type_name ??
          test?.lens_type ??
          "",

        lens_price:
          test?.lens_price ??
          "",

        frame_product_id:
          test?.frame_product_id ??
          "",

        frame_name:
          test?.frame_name ??
          "",

        frame_price:
          test?.frame_price ??
          "",

        test_date:
          test?.test_date
            ? new Date(
                test.test_date
              )
                .toISOString()
                .split("T")[0]
            : emptyForm.test_date,

        notes:
          test?.notes ??
          "",
      });

      setError("");
      setSuccess("");

      setShowModal(true);
    };


  // ===================================================
  // SAVE
  // ===================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !form.customer_id
      ) {
        setError(
          "Please select a customer."
        );

        return;
      }


      try {
        setSaving(true);

        const payload = {
          customer_id:
            Number(
              form.customer_id
            ),

          right_sph:
            form.right_sph === ""
              ? null
              : Number(
                  form.right_sph
                ),

          right_cyl:
            form.right_cyl === ""
              ? null
              : Number(
                  form.right_cyl
                ),

          right_axis:
            form.right_axis === ""
              ? null
              : Number(
                  form.right_axis
                ),

          right_add:
            form.right_add === ""
              ? null
              : Number(
                  form.right_add
                ),

          right_pd:
            form.right_pd === ""
              ? null
              : Number(
                  form.right_pd
                ),

          left_sph:
            form.left_sph === ""
              ? null
              : Number(
                  form.left_sph
                ),

          left_cyl:
            form.left_cyl === ""
              ? null
              : Number(
                  form.left_cyl
                ),

          left_axis:
            form.left_axis === ""
              ? null
              : Number(
                  form.left_axis
                ),

          left_add:
            form.left_add === ""
              ? null
              : Number(
                  form.left_add
                ),

          left_pd:
            form.left_pd === ""
              ? null
              : Number(
                  form.left_pd
                ),

          lens_type_id:
            form.lens_type_id
              ? Number(
                  form.lens_type_id
                )
              : null,

          lens_type_name:
            form.lens_type_name.trim() ||
            null,

          lens_price:
            form.lens_price === ""
              ? 0
              : Number(
                  form.lens_price
                ),

          frame_product_id:
            form.frame_product_id
              ? Number(
                  form.frame_product_id
                )
              : null,

          frame_name:
            form.frame_name.trim() ||
            null,

          frame_price:
            form.frame_price === ""
              ? 0
              : Number(
                  form.frame_price
                ),

          test_date:
            form.test_date ||
            null,

          notes:
            form.notes.trim() ||
            null,
        };


        let response;

        if (editingId) {
          response =
            await updateEyeTest(
              editingId,
              payload
            );
        } else {
          response =
            await createEyeTest(
              payload
            );
        }


        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to save eye test."
          );
        }


        setSuccess(
          editingId
            ? "Eye test updated successfully."
            : "Eye test saved successfully."
        );


        setShowModal(false);
        setEditingId(null);

        setForm({
          ...emptyForm,
        });


        await loadTests();

      } catch (err) {
        console.error(
          "Save Eye Test Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save eye test."
        );

      } finally {
        setSaving(false);
      }
    };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    async (test) => {
      const id =
        getEyeTestId(test);

      if (!id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this eye test?"
        );

      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");

        const response =
          await deleteEyeTest(id);


        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to delete eye test."
          );
        }


        setSuccess(
          "Eye test deleted successfully."
        );

        await loadTests();

      } catch (err) {
        console.error(
          "Delete Eye Test Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete eye test."
        );
      }
    };


  // ===================================================
  // MANUAL FRAME CHANGE
  // ===================================================

  const handleManualFrameChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setManualFrame(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // ===================================================
  // OPEN MANUAL FRAME
  // ===================================================

  const openManualFrame =
    () => {
      setManualFrame({
        ...emptyManualFrame,
      });

      setShowFrameModal(true);
      setError("");
    };


  // ===================================================
  // CLOSE MANUAL FRAME
  // ===================================================

  const closeManualFrame =
    () => {
      if (frameSaving) {
        return;
      }

      setShowFrameModal(false);

      setManualFrame({
        ...emptyManualFrame,
      });
    };


  // ===================================================
  // CREATE MANUAL FRAME
  // ===================================================

  const handleCreateManualFrame =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");


      if (
        !manualFrame.product_name.trim()
      ) {
        setError(
          "Frame name is required."
        );

        return;
      }


      try {
        setFrameSaving(true);


        const payload = {
          product_name:
            manualFrame.product_name.trim(),

          product_image:
            manualFrame.product_image.trim() ||
            null,

          shop_location:
            manualFrame.shop_location,

          description:
            manualFrame.description.trim() ||
            null,

          low_stock_limit:
            Number(
              manualFrame.low_stock_limit
            ) || 0,

          initial_stock:
            Number(
              manualFrame.initial_stock
            ) || 0,

          purchase_price:
            Number(
              manualFrame.purchase_price
            ) || 0,

          selling_price:
            Number(
              manualFrame.selling_price
            ) || 0,
        };


        const response =
          await createManualFrame(
            payload
          );


        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to create frame."
          );
        }


        setSuccess(
          response.message ||
            "Manual frame created successfully."
        );


        await loadFrames();


        const createdProduct =
          response?.product ||
          response?.data?.product;


        if (createdProduct) {
          setForm(
            (previous) => ({
              ...previous,

              frame_product_id:
                String(
                  createdProduct.id
                ),

              frame_name:
                createdProduct.product_name,

              frame_price:
                String(
                  createdProduct.selling_price ||
                    0
                ),
            })
          );
        }


        setShowFrameModal(false);

        setManualFrame({
          ...emptyManualFrame,
        });

      } catch (err) {
        console.error(
          "Manual Frame Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to create manual frame."
        );

      } finally {
        setFrameSaving(false);
      }
    };


  // ===================================================
  // REFRESH
  // ===================================================

  const refreshAll =
    async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadCustomers(),
          loadLensTypes(),
          loadFrames(),
          loadTests(),
        ]);

        setSuccess(
          "Eye testing data refreshed."
        );

      } catch (err) {
        console.error(
          "Refresh Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to refresh data."
        );

      } finally {
        setLoading(false);
      }
    };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="eye-testing-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="eye-testing-header">

        <div>
          <h1>
            Eye Testing
          </h1>

          <p>
            Manage customer eye tests
            and prescription records.
          </p>
        </div>


        <button
          type="button"
          className="eye-testing-add-btn"
          onClick={
            openNewTest
          }
        >
          <Plus size={17} />

          New Eye Test
        </button>

      </div>


      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="eye-testing-alert error">

          <span>!</span>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}


      {success && (
        <div className="eye-testing-alert success">

          <span>✓</span>

          <p>
            {success}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="eye-testing-toolbar">

        <div className="eye-testing-search">

          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search customer, phone, lens or frame..."
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>


        <button
          type="button"
          className="eye-testing-refresh"
          onClick={
            refreshAll
          }
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="eye-testing-summary">

        <div className="summary-card">

          <span className="summary-icon">
            <Eye size={21} />
          </span>

          <div>
            <small>
              Total Eye Tests
            </small>

            <strong>
              {summary.total}
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <span className="summary-icon">
            <CalendarDays size={21} />
          </span>

          <div>
            <small>
              Today's Tests
            </small>

            <strong>
              {summary.today}
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <span className="summary-icon">
            <UserRound size={21} />
          </span>

          <div>
            <small>
              Customers Tested
            </small>

            <strong>
              {summary.customers}
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <span className="summary-icon">
            <Search size={21} />
          </span>

          <div>
            <small>
              Search Results
            </small>

            <strong>
              {filteredTests.length}
            </strong>
          </div>

        </div>

      </div>


      {/* =================================================
          RECORD CARD
      ================================================= */}

      <div className="eye-testing-card">

        <div className="eye-testing-card-header">

          <div>
            <h2>
              Eye Test History
            </h2>

            <p>
              Latest customer examinations
            </p>
          </div>

          <span className="record-count">
            {filteredTests.length}
            {" "}
            Records
          </span>

        </div>


        {loading ? (

          <div className="eye-testing-loading">

            <div className="loading-spinner" />

            <p>
              Loading eye testing records...
            </p>

          </div>

        ) : filteredTests.length === 0 ? (

          <div className="eye-testing-empty">

            <div className="empty-icon">
              <Eye size={25} />
            </div>

            <h3>
              {search
                ? "No records found"
                : "No eye tests yet"}
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "Add your first eye test record to get started."}
            </p>

          </div>

        ) : (

          <div className="eye-testing-table-wrapper">

            <table className="eye-testing-table">

              <thead>
                <tr>

                  <th>
                    Customer
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Right Eye
                  </th>

                  <th>
                    Left Eye
                  </th>

                  <th>
                    Lens / Frame
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>
              </thead>


              <tbody>

                {filteredTests.map(
                  (test) => {

                    const id =
                      getEyeTestId(
                        test
                      );

                    return (
                      <tr key={id}>

                        <td className="customer-cell">

                          <div className="customer-info">

                            <strong>
                              {
                                getTestCustomerName(
                                  test
                                )
                              }
                            </strong>

                            <span>
                              <Phone
                                size={12}
                              />

                              {
                                getTestCustomerMobile(
                                  test
                                )
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span className="date-cell">

                            <CalendarDays
                              size={14}
                            />

                            {
                              formatDate(
                                test?.test_date
                              )
                            }

                          </span>

                        </td>


                        <td>

                          <div className="prescription-mini">

                            <strong>
                              OD
                            </strong>

                            <span>
                              SPH{" "}
                              {
                                displayValue(
                                  test?.right_sph
                                )
                              }
                            </span>

                            <span>
                              CYL{" "}
                              {
                                displayValue(
                                  test?.right_cyl
                                )
                              }
                            </span>

                            <span>
                              AX{" "}
                              {
                                displayValue(
                                  test?.right_axis,
                                  "0"
                                )
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="prescription-mini">

                            <strong>
                              OS
                            </strong>

                            <span>
                              SPH{" "}
                              {
                                displayValue(
                                  test?.left_sph
                                )
                              }
                            </span>

                            <span>
                              CYL{" "}
                              {
                                displayValue(
                                  test?.left_cyl
                                )
                              }
                            </span>

                            <span>
                              AX{" "}
                              {
                                displayValue(
                                  test?.left_axis,
                                  "0"
                                )
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="product-mini">

                            <span>
                              <Glasses
                                size={13}
                              />

                              {
                                test?.lens_type ||
                                test?.lens_type_name ||
                                "No Lens"
                              }
                            </span>

                            <span>
                              <PackagePlus
                                size={13}
                              />

                              {
                                test?.frame_name ||
                                "No Frame"
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="table-actions">

                            <button
                              type="button"
                              className="action-btn view"
                              onClick={() =>
                                setViewTest(
                                  test
                                )
                              }
                              title="View"
                            >
                              <Eye
                                size={15}
                              />
                            </button>


                            <button
                              type="button"
                              className="action-btn edit"
                              onClick={() =>
                                editTest(
                                  test
                                )
                              }
                              title="Edit"
                            >
                              <Edit3
                                size={15}
                              />
                            </button>


                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() =>
                                handleDelete(
                                  test
                                )
                              }
                              title="Delete"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {viewTest && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewTest(null);
            }
          }}
        >

          <div className="view-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Eye Test Details
                </h2>

                <p>
                  Complete customer prescription
                  and lens/frame information.
                </p>
              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setViewTest(null)
                }
              >
                <X size={21} />
              </button>

            </div>


            <div className="view-content">

              <div className="view-customer">

                <div className="view-avatar">
                  <UserRound
                    size={20}
                  />
                </div>

                <div>

                  <strong>
                    {
                      getTestCustomerName(
                        viewTest
                      )
                    }
                  </strong>

                  <span>
                    <Phone size={13} />

                    {
                      getTestCustomerMobile(
                        viewTest
                      )
                    }
                  </span>

                </div>

              </div>


              <div className="view-section">

                <h3>
                  Right Eye (OD)
                </h3>

                <div className="view-grid">

                  <div>
                    <span>
                      SPH
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.right_sph
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      CYL
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.right_cyl
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      AXIS
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.right_axis,
                          "0"
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      ADD
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.right_add
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      PD
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.right_pd
                        )
                      }
                    </strong>
                  </div>

                </div>

              </div>


              <div className="view-section">

                <h3>
                  Left Eye (OS)
                </h3>

                <div className="view-grid">

                  <div>
                    <span>
                      SPH
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.left_sph
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      CYL
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.left_cyl
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      AXIS
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.left_axis,
                          "0"
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      ADD
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.left_add
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      PD
                    </span>

                    <strong>
                      {
                        displayValue(
                          viewTest?.left_pd
                        )
                      }
                    </strong>
                  </div>

                </div>

              </div>


              <div className="view-product-grid">

                <div className="view-product-card">

                  <Glasses
                    size={18}
                  />

                  <span>
                    Lens
                  </span>

                  <strong>
                    {
                      viewTest?.lens_type ||
                      viewTest?.lens_type_name ||
                      "Not selected"
                    }
                  </strong>

                  <small>
                    ₹{" "}
                    {Number(
                      viewTest?.lens_price ||
                        0
                    ).toFixed(2)}
                  </small>

                </div>


                <div className="view-product-card">

                  <PackagePlus
                    size={18}
                  />

                  <span>
                    Frame
                  </span>

                  <strong>
                    {
                      viewTest?.frame_name ||
                      "Not selected"
                    }
                  </strong>

                  <small>
                    ₹{" "}
                    {Number(
                      viewTest?.frame_price ||
                        0
                    ).toFixed(2)}
                  </small>

                </div>

              </div>


              <div className="view-meta">

                <div>
                  <span>
                    Test Date
                  </span>

                  <strong>
                    {
                      formatDate(
                        viewTest?.test_date
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Notes
                  </span>

                  <strong>
                    {
                      viewTest?.notes ||
                      "No notes"
                    }
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="eye-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Eye Test"
                    : "New Eye Test"}
                </h2>

                <p>
                  Enter customer,
                  prescription,
                  lens and frame details.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                <X size={21} />
              </button>

            </div>


            <form
              className="eye-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* CUSTOMER */}

              <div className="form-section">

                <div className="section-title">

                  <UserRound
                    size={17}
                  />

                  <div>
                    <h3>
                      Customer Details
                    </h3>

                    <span>
                      Select customer for this test
                    </span>
                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Customer *
                    </label>

                    <select
                      value={
                        form.customer_id
                      }
                      onChange={
                        handleCustomerChange
                      }
                      required
                    >

                      <option value="">
                        Select Customer
                      </option>

                      {customers.map(
                        (customer) => {

                          const id =
                            getCustomerId(
                              customer
                            );

                          return (
                            <option
                              key={id}
                              value={id}
                            >
                              {
                                getCustomerName(
                                  customer
                                )
                              }
                              {" - "}
                              {
                                getCustomerMobile(
                                  customer
                                )
                              }
                            </option>
                          );
                        }
                      )}

                    </select>

                  </div>


                  <div className="customer-preview">

                    {selectedCustomer ? (
                      <>

                        <span>
                          Selected Customer
                        </span>

                        <strong>
                          {
                            getCustomerName(
                              selectedCustomer
                            )
                          }
                        </strong>

                        <small>
                          <Phone
                            size={13}
                          />

                          {
                            getCustomerMobile(
                              selectedCustomer
                            )
                          }
                        </small>

                        {customerLatestTest && (
                          <small className="latest-test-info">
                            Previous test:{" "}
                            {
                              formatDate(
                                customerLatestTest.test_date
                              )
                            }
                          </small>
                        )}

                      </>
                    ) : (
                      <>
                        <span>
                          Customer
                        </span>

                        <strong>
                          No customer selected
                        </strong>
                      </>
                    )}

                  </div>

                </div>

              </div>


              {/* PRESCRIPTION */}

              <div className="form-section">

                <div className="section-title">

                  <Eye size={17} />

                  <div>
                    <h3>
                      Prescription
                    </h3>

                    <span>
                      Enter right and left eye values
                    </span>
                  </div>

                </div>


                <div className="prescription-table">

                  <div className="prescription-head">

                    <span />

                    <span>
                      SPH
                    </span>

                    <span>
                      CYL
                    </span>

                    <span>
                      AXIS
                    </span>

                    <span>
                      ADD
                    </span>

                  </div>


                  {/* RIGHT */}

                  <div className="prescription-row">

                    <strong>
                      Right Eye (OD)
                    </strong>

                    <input
                      type="number"
                      step="0.25"
                      name="right_sph"
                      value={
                        form.right_sph
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="right_cyl"
                      value={
                        form.right_cyl
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      min="0"
                      max="180"
                      step="1"
                      name="right_axis"
                      value={
                        form.right_axis
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="right_add"
                      value={
                        form.right_add
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                  </div>


                  {/* LEFT */}

                  <div className="prescription-row">

                    <strong>
                      Left Eye (OS)
                    </strong>

                    <input
                      type="number"
                      step="0.25"
                      name="left_sph"
                      value={
                        form.left_sph
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="left_cyl"
                      value={
                        form.left_cyl
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      min="0"
                      max="180"
                      step="1"
                      name="left_axis"
                      value={
                        form.left_axis
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                    />

                    <input
                      type="number"
                      step="0.25"
                      name="left_add"
                      value={
                        form.left_add
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                    />

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Right PD
                    </label>

                    <input
                      type="number"
                      step="0.5"
                      name="right_pd"
                      value={
                        form.right_pd
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 31"
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Left PD
                    </label>

                    <input
                      type="number"
                      step="0.5"
                      name="left_pd"
                      value={
                        form.left_pd
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 31"
                    />

                  </div>

                </div>

              </div>


              {/* LENS */}

              <div className="form-section">

                <div className="section-title">

                  <Glasses
                    size={17}
                  />

                  <div>

                    <h3>
                      Lens Details
                    </h3>

                    <span>
                      Select lens type and enter price
                    </span>

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Lens Type
                    </label>

                    <select
                      value={
                        form.lens_type_id
                      }
                      onChange={
                        handleLensTypeChange
                      }
                    >

                      <option value="">
                        Select Lens Type
                      </option>

                      {lensTypes.map(
                        (lens) => (
                          <option
                            key={
                              lens.id
                            }
                            value={
                              lens.id
                            }
                          >
                            {
                              lens.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Lens Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="lens_price"
                      value={
                        form.lens_price
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="₹ 0.00"
                    />

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group full">

                    <label>
                      Lens Type Name
                    </label>

                    <input
                      type="text"
                      name="lens_type_name"
                      value={
                        form.lens_type_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Lens type name"
                    />

                  </div>

                </div>

              </div>


              {/* FRAME */}

              <div className="form-section">

                <div className="section-title">

                  <PackagePlus
                    size={17}
                  />

                  <div>

                    <h3>
                      Frame Details
                    </h3>

                    <span>
                      Select an existing product frame
                      or create a manual frame
                    </span>

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Available Frame
                    </label>

                    <select
                      value={
                        form.frame_product_id
                      }
                      onChange={
                        handleFrameChange
                      }
                    >

                      <option value="">
                        Select Frame
                      </option>

                      {frames.map(
                        (frame) => {

                          const id =
                            getFrameId(
                              frame
                            );

                          return (
                            <option
                              key={id}
                              value={id}
                            >
                              {
                                getFrameName(
                                  frame
                                )
                              }
                              {" - ₹"}
                              {
                                getFramePrice(
                                  frame
                                ).toFixed(2)
                              }
                              {" - Stock: "}
                              {
                                frame?.current_stock ??
                                0
                              }
                            </option>
                          );
                        }
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Frame Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="frame_price"
                      value={
                        form.frame_price
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="₹ 0.00"
                    />

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group full">

                    <label>
                      Selected Frame
                    </label>

                    <input
                      type="text"
                      name="frame_name"
                      value={
                        form.frame_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Frame name"
                    />

                  </div>

                </div>


                {selectedFrame && (
                  <div className="customer-preview">

                    <span>
                      Selected Product Frame
                    </span>

                    <strong>
                      {
                        getFrameName(
                          selectedFrame
                        )
                      }
                    </strong>

                    <small>
                      ₹{" "}
                      {
                        getFramePrice(
                          selectedFrame
                        ).toFixed(2)
                      }

                      {" | Stock: "}

                      {
                        selectedFrame?.current_stock ??
                        0
                      }
                    </small>

                  </div>
                )}


                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    openManualFrame
                  }
                >
                  <Plus size={16} />

                  Add Manual Frame
                </button>

              </div>


              {/* TEST DETAILS */}

              <div className="form-section">

                <div className="section-title">

                  <FileText
                    size={17}
                  />

                  <div>

                    <h3>
                      Test Details
                    </h3>

                    <span>
                      Examination information
                    </span>

                  </div>

                </div>


                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Test Date
                    </label>

                    <input
                      type="date"
                      name="test_date"
                      value={
                        form.test_date
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Customer Mobile
                    </label>

                    <input
                      value={
                        selectedCustomer
                          ? getCustomerMobile(
                              selectedCustomer
                            )
                          : ""
                      }
                      readOnly
                      placeholder="Customer mobile"
                    />

                  </div>

                </div>


                <div className="form-group full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    rows="4"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Additional observations..."
                  />

                </div>

              </div>


              {/* ACTIONS */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-test-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />

                      {editingId
                        ? "Update Eye Test"
                        : "Save Eye Test"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =================================================
          MANUAL FRAME MODAL
      ================================================= */}

      {showFrameModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeManualFrame();
            }
          }}
        >

          <div className="frame-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Add Manual Frame
                </h2>

                <p>
                  Create a frame product
                  directly from Eye Testing.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeManualFrame
                }
                disabled={
                  frameSaving
                }
              >
                <X size={21} />
              </button>

            </div>


            <form
              className="eye-form"
              onSubmit={
                handleCreateManualFrame
              }
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Frame Name *
                  </label>

                  <input
                    type="text"
                    name="product_name"
                    value={
                      manualFrame.product_name
                    }
                    onChange={
                      handleManualFrameChange
                    }
                    placeholder="Enter frame name"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Selling Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="selling_price"
                    value={
                      manualFrame.selling_price
                    }
                    onChange={
                      handleManualFrameChange
                    }
                    placeholder="₹ 0.00"
                  />

                </div>

              </div>


              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Shop Location
                  </label>

                  <select
                    name="shop_location"
                    value={
                      manualFrame.shop_location
                    }
                    onChange={
                      handleManualFrameChange
                    }
                  >

                    <option value="Arjunganj">
                      Arjunganj
                    </option>

                    <option value="Telibag">
                      Telibag
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Initial Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="initial_stock"
                    value={
                      manualFrame.initial_stock
                    }
                    onChange={
                      handleManualFrameChange
                    }
                  />

                </div>

              </div>


              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Low Stock Limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="low_stock_limit"
                    value={
                      manualFrame.low_stock_limit
                    }
                    onChange={
                      handleManualFrameChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Purchase Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="purchase_price"
                    value={
                      manualFrame.purchase_price
                    }
                    onChange={
                      handleManualFrameChange
                    }
                    placeholder="₹ 0.00"
                  />

                </div>

              </div>


              <div className="form-group full">

                <label>
                  Product Image URL
                </label>

                <input
                  type="text"
                  name="product_image"
                  value={
                    manualFrame.product_image
                  }
                  onChange={
                    handleManualFrameChange
                  }
                  placeholder="/uploads/products/frame.jpg"
                />

              </div>


              <div className="form-group full">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  rows="4"
                  value={
                    manualFrame.description
                  }
                  onChange={
                    handleManualFrameChange
                  }
                  placeholder="Frame description..."
                />

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeManualFrame
                  }
                  disabled={
                    frameSaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-test-btn"
                  disabled={
                    frameSaving
                  }
                >

                  {frameSaving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <PackagePlus
                        size={16}
                      />

                      Save Frame
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default EyeTesting;
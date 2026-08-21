import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Trash2,
  Printer,
  X,
  Eye,
  RefreshCw,
  UserRound,
  Glasses,
  IndianRupee,
  FileText,
  CheckCircle2,
} from "lucide-react";

import "./Sales.css";

import {
  getSalesCustomers,
  getCustomerSalesInfo,
  getSales,
  getSaleById,
  createSale,
  updatePaymentStatus,
} from "../services/salesService.js";

import {
  getProducts,
} from "../services/productService.js";

// =====================================================
// SERVER URL FOR PRODUCT IMAGES
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SERVER_BASE_URL =
  (import.meta.env.VITE_SERVER_URL ||
    API_BASE_URL.replace(/\/api\/?$/, ""))
    .replace(/\/$/, "");


// =====================================================
// SHOP INFORMATION
// =====================================================

const SHOP_INFO = {
  name: "Chashma Plus",

  address:
    "Arjunganj, Opposite side Shyam Misthan Vatika, Lucknow, U. P., 226002",

  gstNumber:
    "P7WKV5D77N9FTLVQX3RCKUL3",
};


// =====================================================
// DEFAULT FORM
// =====================================================

const DEFAULT_FORM = {
  customer_id: "",

  eye_test_id: "",

  lens_type_id: "",
  lens_type_name: "",
  lens_price: "",

  frame_product_id: "",
  frame_name: "",
  frame_price: "",

  discount_percent: "0",

  gst_enabled: false,
  gst_percent: "18",

  advance_amount: "",

  payment_status: "PENDING",
  payment_method: "Cash",

  notes: "",
};


// =====================================================
// SALES
// =====================================================

const Sales = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [customers, setCustomers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [sales, setSales] =
    useState([]);


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState(
      DEFAULT_FORM
    );


  // ===================================================
  // MANUAL FRAME
  // ===================================================

  const [manualFrame, setManualFrame] =
    useState({
      product_type: "Frame",
      product_name: "",
      selling_price: "",
      shop_location: "Arjunganj",
      minimum_stock: "0",
      description: "",
      image: null,
      preview: "",
    });


  // ===================================================
  // UI
  // ===================================================

  const [showSaleForm, setShowSaleForm] =
    useState(false);

  const [showFrameSelector, setShowFrameSelector] =
    useState(false);

  const [showManualFrame, setShowManualFrame] =
    useState(false);

  const [showSaleDetails, setShowSaleDetails] =
    useState(false);


  // ===================================================
  // SELECTED SALE
  // ===================================================

  const [selectedSale, setSelectedSale] =
    useState(null);


  // ===================================================
  // SEARCH
  // ===================================================

  const [frameSearch, setFrameSearch] =
    useState("");
    const [customerSearch, setCustomerSearch] = useState("");

const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [showCustomerSelector, setShowCustomerSelector] =
    useState(false);

  const [salesSearch, setSalesSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("ALL");


  // ===================================================
  // STATUS
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ===================================================
  // TOKEN
  // ===================================================

  const getToken = () => {
    return (
      localStorage.getItem(
        "token"
      ) ||
      localStorage.getItem(
        "authToken"
      ) ||
      localStorage.getItem(
        "accessToken"
      ) ||
      ""
    );
  };


  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        customerResponse,
        productResponse,
        salesResponse,
      ] = await Promise.all([
        getSalesCustomers(),
        getProducts(),
        getSales(),
      ]);


      // -----------------------------------------------
      // CUSTOMERS
      // -----------------------------------------------

      const customerList =
        Array.isArray(
          customerResponse?.customers
        )
          ? customerResponse.customers
          : Array.isArray(
              customerResponse?.data?.customers
            )
            ? customerResponse.data.customers
            : [];


      // -----------------------------------------------
      // PRODUCTS
      // -----------------------------------------------

      const productList =
        Array.isArray(
          productResponse?.products
        )
          ? productResponse.products
          : Array.isArray(
              productResponse?.data?.products
            )
            ? productResponse.data.products
            : [];


      // -----------------------------------------------
      // SALES
      // -----------------------------------------------

      const salesList =
        Array.isArray(
          salesResponse?.sales
        )
          ? salesResponse.sales
          : Array.isArray(
              salesResponse?.data?.sales
            )
            ? salesResponse.data.sales
            : [];


      setCustomers(
        customerList
      );

      setProducts(
        productList
      );

      setSales(
        salesList
      );

    } catch (err) {

      console.error(
        "Sales Load Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load sales data"
      );

    } finally {

      setLoading(false);
    }
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);


  // ===================================================
  // CUSTOMER HELPERS
  // ===================================================

  const getCustomerId = (
    customer
  ) => {
    return (
      customer?.CustomerID ??
      customer?.id ??
      ""
    );
  };


  const getCustomerName = (
    customer
  ) => {
    return (
      customer?.FullName ||
      customer?.CustomerName ||
      customer?.name ||
      "Customer"
    );
  };


  const getCustomerMobile = (
    customer
  ) => {
    return (
      customer?.MobileNumber ||
      customer?.Mobile ||
      customer?.Phone ||
      customer?.PhoneNumber ||
      ""
    );
  };


  // ===================================================
  // PRODUCT HELPERS
  // ===================================================

  const getProductId = (
    product
  ) => {
    return (
      product?.id ??
      product?.ProductID ??
      ""
    );
  };


  const getProductName = (
    product
  ) => {
    return (
      product?.product_name ||
      product?.ProductName ||
      product?.name ||
      "Unnamed Product"
    );
  };


  const getProductPrice = (
    product
  ) => {
    const values = [
      product?.selling_price,
      product?.SellingPrice,
      product?.Price,
      product?.SalePrice,
      product?.UnitPrice,
    ];

    for (
      const value of values
    ) {

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        const number =
          Number(value);

        if (
          Number.isFinite(
            number
          )
        ) {
          return number;
        }
      }
    }

    return 0;
  };


  const getProductStock = (
    product
  ) => {
    return Number(
      product?.current_stock ??
      product?.stock_quantity ??
      product?.stock ??
      0
    );
  };


  // ===================================================
  // PRODUCT IMAGE
  // ===================================================

  const getProductImage = (
    product
  ) => {

    if (!product) {
      return "";
    }


    let value =
      product.product_image ||
      product.ProductImage ||
      product.image ||
      "";


    if (!value) {
      return "";
    }


    if (
      Array.isArray(value)
    ) {
      value =
        value[0] || "";
    }


    if (
      typeof value === "string"
    ) {

      try {

        const parsed =
          JSON.parse(value);

        if (
          Array.isArray(
            parsed
          )
        ) {
          value =
            parsed[0] || "";
        }

      } catch {
        // normal string
      }
    }


    if (!value) {
      return "";
    }


    if (
      value.startsWith(
        "http://"
      ) ||
      value.startsWith(
        "https://"
      )
    ) {
      return value;
    }


    if (
      value.startsWith(
        "/"
      )
    ) {
      return `${SERVER_BASE_URL}${value}`;
    }


    return `${SERVER_BASE_URL}/${value}`;
  };


  // ===================================================
  // FRAME PRODUCTS
  // ===================================================

  const frameProducts =
    useMemo(() => {

      return products.filter(
        (product) => {

          const type =
            String(
              product?.product_type ||
              product?.ProductType ||
              ""
            ).toLowerCase();

          return (
            type === "frame" &&
            product?.is_active !== 0 &&
            getProductStock(
              product
            ) > 0
          );
        }
      );

    }, [products]);


  // ===================================================
  // FILTER FRAMES
  // ===================================================

  const filteredFrames =
    useMemo(() => {

      const query =
        frameSearch
          .trim()
          .toLowerCase();


      if (!query) {
        return frameProducts;
      }


      return frameProducts.filter(
        (product) => {

          const name =
            getProductName(
              product
            ).toLowerCase();

          const location =
            String(
              product?.shop_location ||
              ""
            ).toLowerCase();

          return (
            name.includes(
              query
            ) ||
            location.includes(
              query
            )
          );
        }
      );

    }, [
      frameProducts,
      frameSearch,
    ]);


  // ===================================================
  // FILTER CUSTOMERS
  // ===================================================

  const filteredCustomers =
    useMemo(() => {

      const query =
        customerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) => {

          const name =
            getCustomerName(
              customer
            ).toLowerCase();

          const mobile =
            String(
              getCustomerMobile(
                customer
              )
            ).toLowerCase();

          return (
            name.includes(query) ||
            mobile.includes(query)
          );
        }
      );

    }, [
      customers,
      customerSearch,
    ]);


  // ===================================================
  // CUSTOMER SELECT
  // ===================================================

  const selectCustomer =
    async (customer) => {

      const customerId =
        getCustomerId(
          customer
        );

      await handleCustomerChange({
        target: {
          value: customerId,
        },
      });

      setShowCustomerSelector(
        false
      );

      setCustomerSearch(
        ""
      );
    };


  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (previous) => {
        const nextValue =
          type === "checkbox"
            ? checked
            : value;

        const nextForm = {
          ...previous,
          [name]: nextValue,
        };

        if (name === "advance_amount") {
          const advance = Number(nextValue) || 0;

          if (advance >= calculation.grandTotal && calculation.grandTotal > 0) {
            nextForm.payment_status = "PAID";
          } else if (advance > 0) {
            nextForm.payment_status = "PARTIAL";
          } else {
            nextForm.payment_status = "PENDING";
          }
        }

        return nextForm;
      }
    );
  };


  // ===================================================
  // CUSTOMER CHANGE
  // ===================================================

  const handleCustomerChange =
    async (
      event
    ) => {

      const customerId =
        event.target.value;


      setForm(
        (previous) => ({
          ...previous,

          customer_id:
            customerId,

          eye_test_id: "",

          lens_type_id: "",
          lens_type_name: "",
          lens_price: "",

          frame_product_id: "",
          frame_name: "",
          frame_price: "",
        })
      );


      if (!customerId) {
        return;
      }


      try {

        const response =
          await getCustomerSalesInfo(
            customerId
          );


        const latestEyeTest =
          response?.latestEyeTest ||
          response?.data?.latestEyeTest ||
          null;


        if (
          latestEyeTest
        ) {

          setForm(
            (previous) => ({
              ...previous,

              eye_test_id:
                latestEyeTest.id
                  ? String(
                      latestEyeTest.id
                    )
                  : "",

              lens_type_id:
                latestEyeTest.lens_type_id
                  ? String(
                      latestEyeTest.lens_type_id
                    )
                  : "",

              lens_type_name:
                latestEyeTest.lens_type_name ||
                latestEyeTest.lens_type ||
                "",

              lens_price:
                latestEyeTest.lens_price !==
                  null &&
                latestEyeTest.lens_price !==
                  undefined
                  ? String(
                      latestEyeTest.lens_price
                    )
                  : "",
            })
          );
        }

      } catch (err) {

        console.warn(
          "Customer information could not be loaded:",
          err
        );
      }
    };


  // ===================================================
  // FRAME SELECT
  // ===================================================

  const selectFrame =
    (product) => {

      const productId =
        getProductId(
          product
        );


      setForm(
        (previous) => ({
          ...previous,

          frame_product_id:
            String(
              productId
            ),

          frame_name:
            getProductName(
              product
            ),

          frame_price:
            String(
              getProductPrice(
                product
              )
            ),
        })
      );


      setShowFrameSelector(
        false
      );

      setFrameSearch("");
    };


  // ===================================================
  // CLEAR FRAME
  // ===================================================

  const clearFrame = () => {

    setForm(
      (previous) => ({
        ...previous,

        frame_product_id: "",
        frame_name: "",
        frame_price: "",
      })
    );
  };


  // ===================================================
  // MANUAL FRAME INPUT
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
  // MANUAL FRAME IMAGE
  // ===================================================

  const handleManualFrameImage =
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      const preview =
        URL.createObjectURL(
          file
        );


      setManualFrame(
        (previous) => ({
          ...previous,

          image: file,

          preview,
        })
      );
    };


  // ===================================================
  // USE MANUAL FRAME
  // ===================================================

  const useManualFrame =
    (event) => {

      event.preventDefault();


      const name =
        manualFrame.product_name.trim();

      const price =
        Number(
          manualFrame.selling_price
        );


      if (!name) {

        setError(
          "Manual frame name is required."
        );

        return;
      }


      if (
        !Number.isFinite(
          price
        ) ||
        price <= 0
      ) {

        setError(
          "Enter a valid manual frame price."
        );

        return;
      }


      setForm(
        (previous) => ({
          ...previous,

          frame_product_id: "",

          frame_name:
            name,

          frame_price:
            String(price),
        })
      );


      setError("");

      setShowManualFrame(
        false
      );
    };


  // ===================================================
  // CALCULATION
  // ===================================================

  const calculation =
    useMemo(() => {

      const lensPrice =
        Number(
          form.lens_price
        ) || 0;


      const framePrice =
        Number(
          form.frame_price
        ) || 0;


      const discountPercent =
        Number(
          form.discount_percent
        ) || 0;


      const subtotal =
        lensPrice +
        framePrice;


      const discountAmount =
        (
          subtotal *
          discountPercent
        ) / 100;


      const taxableAmount =
        Math.max(
          0,
          subtotal -
          discountAmount
        );


      const gstPercent =
        form.gst_enabled
          ? Number(
              form.gst_percent
            ) || 0
          : 0;


      const gstAmount =
        (
          taxableAmount *
          gstPercent
        ) / 100;


      const grandTotal =
        taxableAmount +
        gstAmount;

      const advanceAmount =
        Number(form.advance_amount) || 0;

      const balanceDue =
        Math.max(
          0,
          Number(
            (grandTotal - advanceAmount).toFixed(2)
          )
        );


      return {
        lensPrice,
        framePrice,
        subtotal,
        discountPercent,
        discountAmount,
        taxableAmount,
        gstPercent,
        gstAmount,
        grandTotal,
        advanceAmount,
        balanceDue,
      };

    }, [form]);


  // ===================================================
  // OPEN NEW SALE
  // ===================================================

  const openSaleForm =
    () => {

      setForm({
        ...DEFAULT_FORM,
      });

      setManualFrame({
        product_type: "Frame",
        product_name: "",
        selling_price: "",
        shop_location:
          "Arjunganj",
        minimum_stock: "0",
        description: "",
        image: null,
        preview: "",
      });

      setError("");
      setSuccess("");

      setShowSaleForm(
        true
      );
    };


  // ===================================================
  // CREATE SALE
  // ===================================================

  const handleCreateSale =
    async (
      event
    ) => {

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


      if (
        calculation.lensPrice <=
          0 &&
        calculation.framePrice <=
          0
      ) {

        setError(
          "Please enter lens or frame details."
        );

        return;
      }


      if (
        form.frame_product_id &&
        calculation.framePrice <=
          0
      ) {

        setError(
          "Invalid frame price."
        );

        return;
      }


      if (
        calculation.advanceAmount < 0
      ) {
        setError(
          "Advance amount cannot be negative."
        );
        return;
      }

      if (
        calculation.advanceAmount >
        calculation.grandTotal
      ) {
        setError(
          "Advance amount cannot be greater than grand total."
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

          eye_test_id:
            form.eye_test_id
              ? Number(
                  form.eye_test_id
                )
              : null,

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
            calculation.lensPrice,

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
            calculation.framePrice,

          discount_percent:
            calculation.discountPercent,

          gst_enabled:
            Boolean(
              form.gst_enabled
            ),

          gst_percent:
            form.gst_enabled
              ? calculation.gstPercent
              : 0,

          advance_amount:
            calculation.advanceAmount,

          payment_status:
            calculation.advanceAmount >= calculation.grandTotal &&
            calculation.grandTotal > 0
              ? "PAID"
              : calculation.advanceAmount > 0
                ? "PARTIAL"
                : form.payment_status,

          payment_method:
            form.payment_method ||
            null,

          notes:
            form.notes.trim() ||
            null,
        };


        const response =
          await createSale(
            payload
          );


        if (
          !response?.success
        ) {

          throw new Error(
            response?.message ||
              "Failed to create sale"
          );
        }


        // ---------------------------------------------
        // STORE CREATED SALE FOR PRINT
        // ---------------------------------------------

        const createdSale = {
          sale:
            response.sale ||
            response.data?.sale ||
            null,

          items:
            response.items ||
            response.data?.items ||
            [],

          calculation:
            response.calculation ||
            response.data?.calculation ||
            null,
        };


        setSelectedSale(
          createdSale
        );


        setShowSaleForm(
          false
        );


        setShowSaleDetails(
          true
        );


        setSuccess(
          response.message ||
            "Sale created successfully."
        );


        await loadData();

      } catch (err) {

        console.error(
          "Create Sale Error:",
          err
        );


        setError(
          err?.message ||
            "Unable to create sale."
        );

      } finally {

        setSaving(false);
      }
    };


  // ===================================================
  // OPEN SALE DETAILS
  // ===================================================

  const openSaleDetails =
    async (
      saleId
    ) => {

      try {

        setError("");


        const response =
          await getSaleById(
            saleId
          );


        if (
          !response?.success
        ) {

          throw new Error(
            response?.message ||
              "Failed to fetch sale"
          );
        }


        setSelectedSale(
          response
        );


        setShowSaleDetails(
          true
        );

      } catch (err) {

        console.error(
          "Sale Details Error:",
          err
        );


        setError(
          err?.message ||
            "Unable to load sale details."
        );
      }
    };


  // ===================================================
  // UPDATE PAYMENT
  // ===================================================

  const handlePaymentUpdate =
    async (
      saleId,
      status
    ) => {

      try {

        setError("");


        const response =
          await updatePaymentStatus(
            saleId,
            {
              payment_status:
                status,

              payment_method:
                selectedSale
                  ?.sale
                  ?.payment_method ||
                null,
            }
          );


        if (
          !response?.success
        ) {

          throw new Error(
            response?.message ||
              "Failed to update payment"
          );
        }


        setSuccess(
          "Payment status updated successfully."
        );


        await loadData();


        if (
          selectedSale
            ?.sale
            ?.id
        ) {

          await openSaleDetails(
            selectedSale.sale.id
          );
        }

      } catch (err) {

        console.error(
          "Payment Update Error:",
          err
        );


        setError(
          err?.message ||
            "Unable to update payment."
        );
      }
    };


  // ===================================================
  // PRINT BILL
  // ===================================================

  const printBill = (
    billData,
    type = "NORMAL"
  ) => {

    const sale =
      billData?.sale ||
      null;

    const items =
      Array.isArray(
        billData?.items
      )
        ? billData.items
        : [];


    if (!sale) {

      setError(
        "Invoice data is not available for printing."
      );

      return;
    }


    const invoiceNumber =
      `CP-${String(
        sale.id || "000000"
      ).padStart(
        6,
        "0"
      )}`;


    const customerName =
      sale.customer_name ||
      "Customer";


    const customerMobile =
      sale.customer_mobile ||
      "";


    const subtotal =
      Number(
        sale.subtotal || 0
      );


    const discountAmount =
      Number(
        sale.discount_amount || 0
      );


    const gstAmount =
      Number(
        sale.gst_amount || 0
      );


    const grandTotal =
      Number(
        sale.grand_total || 0
      );


    const advanceAmount =
      Number(
        sale.advance_amount || 0
      );

    const balanceDue =
      Math.max(
        0,
        Number(
          (grandTotal - advanceAmount).toFixed(2)
        )
      );

    const gstEnabled =
      Boolean(
        sale.gst_enabled
      );


    const taxableAmount =
      subtotal -
      discountAmount;


    const date =
      sale.sale_date
        ? new Date(
            sale.sale_date
          ).toLocaleDateString(
            "en-IN"
          )
        : new Date().toLocaleDateString(
            "en-IN"
          );


    const itemRows =
      items
        .map(
          (
            item,
            index
          ) => {

            const price =
              Number(
                item.unit_price ||
                0
              );

            const total =
              Number(
                item.total_price ||
                0
              );

            return `
              <tr>
                <td>
                  ${index + 1}
                </td>

                <td>
                  <strong>
                    ${
                      item.item_name ||
                      "Item"
                    }
                  </strong>

                  <small>
                    ${
                      item.item_type ||
                      ""
                    }
                  </small>
                </td>

                <td>
                  ${item.quantity || 1}
                </td>

                <td>
                  ₹${money(price)}
                </td>

                <td>
                  ₹${money(total)}
                </td>
              </tr>
            `;
          }
        )
        .join("");


    const gstSection =
      type === "GST"
        ? `
          <div class="tax-box">

            <div>
              <span>
                Taxable Amount
              </span>

              <strong>
                ₹${money(
                  taxableAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                GST ${
                  Number(
                    sale.gst_percent ||
                    0
                  )
                }%
              </span>

              <strong>
                ₹${money(
                  gstAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                CGST
              </span>

              <strong>
                ₹${money(
                  gstAmount / 2
                )}
              </strong>
            </div>

            <div>
              <span>
                SGST
              </span>

              <strong>
                ₹${money(
                  gstAmount / 2
                )}
              </strong>
            </div>

          </div>
        `
        : "";


    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          ${
            type === "GST"
              ? "GST Invoice"
              : "Bill"
          }
          - ${invoiceNumber}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .invoice {
            max-width: 850px;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #111827;
          }

          .company h1 {
            margin: 0 0 6px;
            font-size: 28px;
          }

          .company p {
            margin: 4px 0;
            font-size: 13px;
            color: #4b5563;
          }

          .invoice-title {
            text-align: right;
          }

          .invoice-title h2 {
            margin: 0;
            font-size: 24px;
          }

          .invoice-title p {
            margin: 6px 0;
            font-size: 13px;
          }

          .customer {
            display: grid;
            grid-template-columns:
              1fr 1fr;
            gap: 20px;
            margin: 25px 0;
            padding: 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
          }

          .customer strong {
            display: block;
            margin-bottom: 5px;
          }

          .customer p {
            margin: 3px 0;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th {
            background: #f3f4f6;
            font-size: 12px;
            text-transform: uppercase;
            text-align: left;
          }

          th,
          td {
            padding: 12px;
            border: 1px solid #d1d5db;
          }

          td {
            font-size: 13px;
          }

          td small {
            display: block;
            margin-top: 3px;
            color: #6b7280;
          }

          .totals {
            width: 340px;
            margin-left: auto;
            margin-top: 20px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
            font-size: 14px;
          }

          .grand {
            margin-top: 7px;
            padding-top: 12px;
            border-top: 2px solid #111827;
            font-size: 18px;
            font-weight: 800;
          }

          .tax-box {
            margin-top: 10px;
            padding: 10px 0;
          }

          .tax-box div {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 13px;
          }

          .payment {
            margin-top: 25px;
            padding: 15px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }

          .payment p {
            margin: 5px 0;
            font-size: 13px;
          }

          .footer {
            margin-top: 35px;
            padding-top: 18px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }

          @media print {

            body {
              padding: 0;
            }

            .invoice {
              max-width: none;
            }

          }

        </style>

      </head>

      <body>

        <div class="invoice">

          <div class="header">

            <div class="company">

              <h1>
                ${SHOP_INFO.name}
              </h1>

              <p>
                ${SHOP_INFO.address}
              </p>

              ${
                type === "GST"
                  ? `
                    <p>
                      GSTIN:
                      ${SHOP_INFO.gstNumber}
                    </p>
                  `
                  : ""
              }

            </div>


            <div class="invoice-title">

              <h2>
                ${
                  type === "GST"
                    ? "TAX INVOICE"
                    : "BILL"
                }
              </h2>

              <p>
                Invoice:
                <strong>
                  ${invoiceNumber}
                </strong>
              </p>

              <p>
                Date:
                ${date}
              </p>

            </div>

          </div>


          <div class="customer">

            <div>

              <strong>
                Customer Details
              </strong>

              <p>
                Name:
                ${customerName}
              </p>

              <p>
                Mobile:
                ${customerMobile || "-"}
              </p>

            </div>


            <div>

              <strong>
                Payment
              </strong>

              <p>
                Method:
                ${
                  sale.payment_method ||
                  "-"
                }
              </p>

              <p>
                Status:
                ${
                  sale.payment_status ||
                  "-"
                }
              </p>

            </div>

          </div>


          <table>

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  Item
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Price
                </th>

                <th>
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                itemRows ||
                `
                  <tr>
                    <td colspan="5">
                      No items
                    </td>
                  </tr>
                `
              }

            </tbody>

          </table>


          <div class="totals">

            <div class="total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹${money(
                  subtotal
                )}
              </strong>

            </div>


            ${
              discountAmount > 0
                ? `
                  <div class="total-row">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -₹${money(
                        discountAmount
                      )}
                    </strong>

                  </div>
                `
                : ""
            }


            ${
              gstSection
            }


            <div class="total-row grand">

              <span>
                Grand Total
              </span>

              <strong>
                ₹${money(
                  grandTotal
                )}
              </strong>

            </div>

            <div class="total-row">
              <span>Advance Received</span>
              <strong>-₹${money(advanceAmount)}</strong>
            </div>

            <div class="total-row grand">
              <span>Balance Due</span>
              <strong>₹${money(balanceDue)}</strong>
            </div>

          </div>


          <div class="payment">

            <p>
              <strong>
                Payment Method:
              </strong>

              ${
                sale.payment_method ||
                "-"
              }
            </p>

            <p>
              <strong>
                Payment Status:
              </strong>

              ${
                sale.payment_status ||
                "-"
              }
            </p>

            <p><strong>Advance Received:</strong> ₹${money(advanceAmount)}</p>
            <p><strong>Balance Due:</strong> ₹${money(balanceDue)}</p>

          </div>


          <div class="footer">

            <strong>
              Thank you for shopping with Chashma Plus.
            </strong>

            <br />

            Please keep this ${
              type === "GST"
                ? "tax invoice"
                : "bill"
            } for your records.

          </div>

        </div>


        <script>

          window.onload = function () {

            window.print();

            setTimeout(
              function () {
                window.close();
              },
              500
            );

          };

        </script>

      </body>

      </html>
    `;


    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );


    if (!printWindow) {

      setError(
        "Please allow pop-ups to print the bill."
      );

      return;
    }


    printWindow.document.open();

    printWindow.document.write(
      html
    );

    printWindow.document.close();
  };


  // ===================================================
  // MONEY
  // ===================================================

  const money = (
    value
  ) => {

    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };


  // ===================================================
  // DATE
  // ===================================================

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
      return "-";
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


  // ===================================================
  // FILTER SALES
  // ===================================================

  const filteredSales =
    useMemo(() => {

      const query =
        salesSearch
          .trim()
          .toLowerCase();


      return sales.filter(
        (sale) => {

          const matchesSearch =
            !query ||
            [
              sale.id,
              sale.customer_name,
              sale.customer_mobile,
              sale.payment_method,
            ].some(
              (value) =>
                String(
                  value ?? ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  )
            );


          const matchesPayment =
            paymentFilter ===
              "ALL" ||
            String(
              sale.payment_status ||
              ""
            ).toUpperCase() ===
              paymentFilter;


          return (
            matchesSearch &&
            matchesPayment
          );
        }
      );

    }, [
      sales,
      salesSearch,
      paymentFilter,
    ]);


  // ===================================================
  // SELECTED CUSTOMER
  // ===================================================

  const selectedCustomer =
    customers.find(
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


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="sales-page">

      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="sales-page-header">

        <div>

          <h1>
            Sales & Billing
          </h1>

          <p>
            Create customer bills,
            GST invoices and manage payments.
          </p>

        </div>


        <div className="sales-header-actions">

          <button
            type="button"
            className="secondary-btn"
            onClick={
              loadData
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>


          <button
            type="button"
            className="primary-btn"
            onClick={
              openSaleForm
            }
          >
            <Plus
              size={18}
            />

            New Sale
          </button>

        </div>

      </div>


      {/* =================================================
          ALERT
          ================================================= */}

      {error && (

        <div className="sales-alert error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X
              size={16}
            />
          </button>

        </div>
      )}


      {success && (

        <div className="sales-alert success">

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X
              size={16}
            />
          </button>

        </div>
      )}


      {/* =================================================
          SUMMARY
          ================================================= */}

      <div className="sales-summary">

        <div className="summary-card">

          <span>
            Total Sales
          </span>

          <strong>
            {sales.length}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Revenue
          </span>

          <strong>
            ₹
            {money(
              sales.reduce(
                (
                  total,
                  sale
                ) =>
                  total +
                  Number(
                    sale.grand_total ||
                    0
                  ),
                0
              )
            )}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Paid
          </span>

          <strong>
            {
              sales.filter(
                (sale) =>
                  String(
                    sale.payment_status ||
                    ""
                  ).toUpperCase() ===
                  "PAID"
              ).length
            }
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Pending
          </span>

          <strong>
            {
              sales.filter(
                (sale) =>
                  String(
                    sale.payment_status ||
                    ""
                  ).toUpperCase() ===
                  "PENDING"
              ).length
            }
          </strong>

        </div>

      </div>


      {/* =================================================
          SALES TABLE
          ================================================= */}

      <section className="sales-list-card">

        <div className="sales-list-header">

          <div>

            <h2>
              Sales Records
            </h2>

            <p>
              All customer billing records.
            </p>

          </div>


          <div className="sales-filters">

            <div className="sales-search">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search customer..."
                value={
                  salesSearch
                }
                onChange={(event) =>
                  setSalesSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <select
              value={
                paymentFilter
              }
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Payments
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="PENDING">
                Pending
              </option>

            </select>

          </div>

        </div>


        {loading ? (

          <div className="sales-empty">

            <div className="sales-loader"></div>

            <p>
              Loading sales...
            </p>

          </div>

        ) : filteredSales.length === 0 ? (

          <div className="sales-empty">

            <FileText
              size={42}
            />

            <h3>
              No sales found
            </h3>

            <p>
              Create your first customer sale.
            </p>

          </div>

        ) : (

          <div className="sales-table-wrapper">

            <table className="sales-table">

              <thead>

                <tr>

                  <th>
                    Invoice
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Subtotal
                  </th>

                  <th>
                    GST
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredSales.map(
                  (sale) => (

                    <tr
                      key={
                        sale.id
                      }
                    >

                      <td>

                        <strong>
                          CP-
                          {String(
                            sale.id
                          ).padStart(
                            6,
                            "0"
                          )}
                        </strong>

                      </td>


                      <td>

                        <div className="customer-cell">

                          <strong>
                            {
                              sale.customer_name ||
                              "Customer"
                            }
                          </strong>

                          <small>
                            {
                              sale.customer_mobile ||
                              "-"
                            }
                          </small>

                        </div>

                      </td>


                      <td>
                        {
                          formatDate(
                            sale.sale_date
                          )
                        }
                      </td>


                      <td>
                        ₹
                        {money(
                          sale.subtotal
                        )}
                      </td>


                      <td>
                        ₹
                        {money(
                          sale.gst_amount
                        )}
                      </td>


                      <td>

                        <strong>
                          ₹
                          {money(
                            sale.grand_total
                          )}
                        </strong>

                      </td>


                      <td>

                        <span
                          className={`payment-badge ${String(
                            sale.payment_status ||
                            "PENDING"
                          ).toLowerCase()}`}
                        >
                          {
                            sale.payment_status ||
                            "PENDING"
                          }
                        </span>

                      </td>


                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            title="View"
                            onClick={() =>
                              openSaleDetails(
                                sale.id
                              )
                            }
                          >
                            <Eye
                              size={16}
                            />
                          </button>


                          <button
                            type="button"
                            title="Print Bill"
                            onClick={
                              async () => {

                                try {

                                  const data =
                                    await getSaleById(
                                      sale.id
                                    );

                                  if (
                                    data?.success
                                  ) {

                                    printBill(
                                      data,
                                      "NORMAL"
                                    );
                                  }

                                } catch (
                                  err
                                ) {

                                  setError(
                                    err.message ||
                                      "Unable to print bill."
                                  );
                                }
                              }
                            }
                          >
                            <Printer
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          SALE FORM MODAL
          ================================================= */}

      {showSaleForm && (

        <div className="modal-overlay">

          <div className="sale-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Create New Sale
                </h2>

                <p>
                  Create customer bill and invoice.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowSaleForm(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <form
              onSubmit={
                handleCreateSale
              }
            >

              {/* =========================================
                  CUSTOMER
                  ========================================= */}

                <section className="form-section">

                  <div className="form-section-title">
                    <UserRound
                      size={20}
                    />

                    <div>
                      <h3>
                        Customer Details
                      </h3>

                      <p>
                        Select the customer for this sale.
                      </p>
                    </div>
                  </div>


                  <div className="form-grid">
                    <div className="field">

                      <label>
                        Customer *
                      </label>

                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() =>
                          setShowCustomerSelector(
                            true
                          )
                        }
                      >
                        {selectedCustomer
                          ? getCustomerName(
                              selectedCustomer
                            )
                          : "Select Customer"}
                      </button>

                    </div>


                    <div className="field">

                      <label>
                        Mobile
                      </label>

                      <input
                        type="text"
                        value={
                          selectedCustomer
                            ? getCustomerMobile(
                                selectedCustomer
                              )
                            : ""
                        }
                        placeholder="Customer mobile"
                        readOnly
                      />

                    </div>

                  </div>

                </section>


              {/* =========================================
                  FRAME
                  ========================================= */}

              <section className="form-section">

                <div className="form-section-title">

                  <Glasses
                    size={20}
                  />

                  <div>

                    <h3>
                      Frame Details
                    </h3>

                    <p>
                      Select a frame from Products or enter manually.
                    </p>

                  </div>

                </div>


                <div className="frame-mode-buttons">

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      setShowFrameSelector(
                        true
                      )
                    }
                  >
                    <Search
                      size={17}
                    />

                    Select From Products
                  </button>


                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      setShowManualFrame(
                        true
                      )
                    }
                  >
                    <Plus
                      size={17}
                    />

                    Manual Frame Entry
                  </button>

                </div>


                {form.frame_name && (

                  <div className="selected-frame">

                    <div className="selected-frame-icon">

                      <Glasses
                        size={22}
                      />

                    </div>


                    <div>

                      <strong>
                        {
                          form.frame_name
                        }
                      </strong>

                      <span>
                        ₹
                        {money(
                          form.frame_price
                        )}

                        {form.frame_product_id
                          ? " • Product Frame"
                          : " • Manual Frame"}
                      </span>

                    </div>


                    <button
                      type="button"
                      onClick={
                        clearFrame
                      }
                    >
                      <X
                        size={17}
                      />
                    </button>

                  </div>

                )}

              </section>


              {/* =========================================
                  LENS
                  ========================================= */}

              <section className="form-section">

                <div className="form-section-title">

                  <Glasses
                    size={20}
                  />

                  <div>

                    <h3>
                      Lens Details
                    </h3>

                    <p>
                      Latest eye-test lens information can be auto-filled.
                    </p>

                  </div>

                </div>


                <div className="form-grid">

                  <div className="field">

                    <label>
                      Lens Type
                    </label>

                    <input
                      name="lens_type_name"
                      value={
                        form.lens_type_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Single Vision"
                    />

                  </div>


                  <div className="field">

                    <label>
                      Lens Price
                    </label>

                    <div className="input-with-icon">

                      <IndianRupee
                        size={17}
                      />

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
                        placeholder="0.00"
                      />

                    </div>

                  </div>

                </div>

              </section>


              {/* =========================================
                  DISCOUNT / GST
                  ========================================= */}

              <section className="form-section">

                <div className="form-section-title">

                  <IndianRupee
                    size={20}
                  />

                  <div>

                    <h3>
                      Tax & Discount
                    </h3>

                    <p>
                      Configure billing amount.
                    </p>

                  </div>

                </div>


                <div className="form-grid three">

                  <div className="field">

                    <label>
                      Discount
                    </label>

                    <select
                      name="discount_percent"
                      value={
                        form.discount_percent
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="0">
                        No Discount
                      </option>

                      <option value="5">
                        5%
                      </option>

                      <option value="10">
                        10%
                      </option>

                      <option value="15">
                        15%
                      </option>

                      <option value="20">
                        20%
                      </option>

                      <option value="25">
                        25%
                      </option>

                      <option value="30">
                        30%
                      </option>

                    </select>

                  </div>


                  <div className="field gst-toggle-field">

                    <label>
                      GST Bill
                    </label>

                    <label className="switch">

                      <input
                        type="checkbox"
                        name="gst_enabled"
                        checked={
                          form.gst_enabled
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <span></span>

                      <strong>
                        {
                          form.gst_enabled
                            ? "GST Enabled"
                            : "Normal Bill"
                        }
                      </strong>

                    </label>

                  </div>


                  <div className="field">

                    <label>
                      GST %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="gst_percent"
                      value={
                        form.gst_percent
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        !form.gst_enabled
                      }
                    />

                  </div>

                </div>

              </section>


              {/* =========================================
                  PAYMENT
                  ========================================= */}

              <section className="form-section">

                <div className="form-section-title">

                  <FileText
                    size={20}
                  />

                  <div>

                    <h3>
                      Payment
                    </h3>

                    <p>
                      Select payment method and status.
                    </p>

                  </div>

                </div>


                <div className="form-grid three">

                  <div className="field">
                    <label>
                      Advance Received
                    </label>
                    <div className="input-with-icon">
                      <IndianRupee size={17} />
                      <input
                        type="number"
                        min="0"
                        max={calculation.grandTotal}
                        step="0.01"
                        name="advance_amount"
                        value={form.advance_amount}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>
                      Payment Method
                    </label>

                    <select
                      name="payment_method"
                      value={
                        form.payment_method
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="Cash">
                        Cash
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="Card">
                        Card
                      </option>

                      <option value="Bank Transfer">
                        Bank Transfer
                      </option>

                      <option value="Credit">
                        Credit
                      </option>

                    </select>

                  </div>


                  <div className="field">

                    <label>
                      Payment Status
                    </label>

                    <select
                      name="payment_status"
                      value={
                        form.payment_status
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="PAID">
                        Paid
                      </option>

                      <option value="PARTIAL">
                        Partial
                      </option>

                      <option value="PENDING">
                        Pending
                      </option>

                    </select>

                  </div>

                </div>


                <div className="field">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Optional notes..."
                  />

                </div>

              </section>


              {/* =========================================
                  SUMMARY
                  ========================================= */}

              <section className="sale-calculation">

                <div>

                  <span>
                    Frame
                  </span>

                  <strong>
                    ₹
                    {money(
                      calculation.framePrice
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Lens
                  </span>

                  <strong>
                    ₹
                    {money(
                      calculation.lensPrice
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹
                    {money(
                      calculation.subtotal
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Discount
                  </span>

                  <strong>
                    -₹
                    {money(
                      calculation.discountAmount
                    )}
                  </strong>

                </div>


                {form.gst_enabled && (

                  <div>

                    <span>
                      GST (
                      {
                        calculation.gstPercent
                      }
                      %)
                    </span>

                    <strong>
                      ₹
                      {money(
                        calculation.gstAmount
                      )}
                    </strong>

                  </div>

                )}

                <div>
                  <span>Advance Received</span>
                  <strong>-₹{money(calculation.advanceAmount)}</strong>
                </div>


                <div className="grand-total-row">

                  <span>
                    Grand Total
                  </span>

                  <strong>
                    ₹
                    {money(
                      calculation.grandTotal
                    )}
                  </strong>

                </div>

                <div className="grand-total-row">
                  <span>Balance Due</span>
                  <strong>₹{money(calculation.balanceDue)}</strong>
                </div>

              </section>


              {/* =========================================
                  FOOTER
                  ========================================= */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowSaleForm(
                      false
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : "Create Sale"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          CUSTOMER SELECTOR
          ================================================= */}

      {showCustomerSelector && (

        <div className="modal-overlay">

          <div className="frame-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Select Customer
                </h2>

                <p>
                  Search customer by name or mobile.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCustomerSelector(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <div className="frame-search">

              <Search
                size={18}
              />

              <input
                type="text"
                value={
                  customerSearch
                }
                onChange={(event) =>
                  setCustomerSearch(
                    event.target.value
                  )
                }
                placeholder="Search customer..."
                autoFocus
              />

            </div>


            <div className="frame-list">

              {filteredCustomers.length ===
              0 ? (

                <div className="sales-empty small">
                  <UserRound
                    size={35}
                  />
                  <p>
                    No customers found.
                  </p>
                </div>

              ) : (

                filteredCustomers.map(
                  (customer) => {

                    const id =
                      getCustomerId(
                        customer
                      );

                    return (

                      <button
                        type="button"
                        className="frame-option"
                        key={id}
                        onClick={() =>
                          selectCustomer(
                            customer
                          )
                        }
                      >

                        <div>
                          <strong>
                            {getCustomerName(
                              customer
                            )}
                          </strong>

                          <p>
                            {getCustomerMobile(
                              customer
                            ) || "-"}
                          </p>
                        </div>

                      </button>

                    );
                  }
                )

              )}

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          FRAME SELECTOR
          ================================================= */}

      {showFrameSelector && (

        <div className="modal-overlay">

          <div className="frame-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Select Frame
                </h2>

                <p>
                  Frames available in inventory.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowFrameSelector(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <div className="frame-search">

              <Search
                size={18}
              />

              <input
                type="text"
                value={
                  frameSearch
                }
                onChange={(event) =>
                  setFrameSearch(
                    event.target.value
                  )
                }
                placeholder="Search frame..."
              />

            </div>


            <div className="frame-list">

              {filteredFrames.length ===
              0 ? (

                <div className="sales-empty small">

                  <Glasses
                    size={35}
                  />

                  <p>
                    No frames available.
                  </p>

                </div>

              ) : (

                filteredFrames.map(
                  (product) => {

                    const image =
                      getProductImage(
                        product
                      );

                    return (

                      <button
                        type="button"
                        className="frame-option"
                        key={
                          getProductId(
                            product
                          )
                        }
                        onClick={() =>
                          selectFrame(
                            product
                          )
                        }
                      >

                        <div className="sales-frame-image">

                          {image ? (

                            <img
                              src={
                                image
                              }
                              alt={
                                getProductName(
                                  product
                                )
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />

                          ) : (

                            <Glasses
                              size={25}
                            />

                          )}

                        </div>


                        <div className="frame-option-info">

                          <strong>
                            {
                              getProductName(
                                product
                              )
                            }
                          </strong>

                          <span>
                            {
                              product.shop_location ||
                              "-"
                            }
                          </span>

                          <small>
                            Stock:
                            {" "}
                            {
                              getProductStock(
                                product
                              )
                            }
                          </small>

                        </div>


                        <strong className="frame-price">

                          ₹
                          {money(
                            getProductPrice(
                              product
                            )
                          )}

                        </strong>

                      </button>

                    );
                  }
                )

              )}

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          MANUAL FRAME
          ================================================= */}

      {showManualFrame && (

        <div className="modal-overlay">

          <div className="manual-frame-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Manual Frame Entry
                </h2>

                <p>
                  Enter frame details like the Products form.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowManualFrame(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <form
              onSubmit={
                useManualFrame
              }
            >

              <div className="manual-frame-body">

                <div className="field">

                  <label>
                    Product Type
                  </label>

                  <input
                    value="Frame"
                    readOnly
                  />

                </div>


                <div className="field">

                  <label>
                    Frame Name *
                  </label>

                  <input
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


                <div className="form-grid">

                  <div className="field">

                    <label>
                      Selling Price *
                    </label>

                    <div className="input-with-icon">

                      <IndianRupee
                        size={17}
                      />

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
                        placeholder="0.00"
                        required
                      />

                    </div>

                  </div>


                  <div className="field">

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

                </div>


                <div className="field">

                  <label>
                    Minimum Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="minimum_stock"
                    value={
                      manualFrame.minimum_stock
                    }
                    onChange={
                      handleManualFrameChange
                    }
                  />

                </div>


                <div className="field">

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


                <div className="field">

                  <label>
                    Frame Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleManualFrameImage
                    }
                  />

                </div>


                {manualFrame.preview && (

                  <div className="manual-frame-preview">

                    <img
                      src={
                        manualFrame.preview
                      }
                      alt="Frame preview"
                    />

                  </div>

                )}

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowManualFrame(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                >
                  Use This Frame
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          SALE DETAILS / PRINT
          ================================================= */}

      {showSaleDetails &&
        selectedSale && (

          <div className="modal-overlay">

            <div className="sale-details-modal">

              <div className="modal-header">

                <div>

                  <h2>
                    Sale Details
                  </h2>

                  <p>
                    Invoice preview and print options.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowSaleDetails(
                      false
                    )
                  }
                >
                  <X
                    size={20}
                  />
                </button>

              </div>


              <div className="invoice-preview">

                <div className="invoice-preview-header">

                  <div>

                    <h2>
                      {
                        SHOP_INFO.name
                      }
                    </h2>

                    <p>
                      {
                        SHOP_INFO.address
                      }
                    </p>

                  </div>


                  <div className="invoice-number">

                    <strong>
                      BILL
                    </strong>

                    <span>
                      CP-
                      {String(
                        selectedSale
                          ?.sale
                          ?.id ||
                        0
                      ).padStart(
                        6,
                        "0"
                      )}
                    </span>

                  </div>

                </div>


                <div className="invoice-customer">

                  <div>

                    <span>
                      Customer
                    </span>

                    <strong>
                      {
                        selectedSale
                          ?.sale
                          ?.customer_name ||
                        "Customer"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Mobile
                    </span>

                    <strong>
                      {
                        selectedSale
                          ?.sale
                          ?.customer_mobile ||
                        "-"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Date
                    </span>

                    <strong>
                      {
                        formatDate(
                          selectedSale
                            ?.sale
                            ?.sale_date
                        )
                      }
                    </strong>

                  </div>

                </div>


                <table className="invoice-items">

                  <thead>

                    <tr>

                      <th>
                        Item
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Price
                      </th>

                      <th>
                        Total
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {(
                      selectedSale.items ||
                      []
                    ).map(
                      (item) => (

                        <tr
                          key={
                            item.id
                          }
                        >

                          <td>
                            {
                              item.item_name
                            }
                          </td>

                          <td>
                            {
                              item.item_type
                            }
                          </td>

                          <td>
                            {
                              item.quantity
                            }
                          </td>

                          <td>
                            ₹
                            {money(
                              item.unit_price
                            )}
                          </td>

                          <td>
                            ₹
                            {money(
                              item.total_price
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>


                <div className="invoice-total-box">

                  <div>

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      ₹
                      {money(
                        selectedSale
                          ?.sale
                          ?.subtotal
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Discount
                    </span>

                    <strong>
                      -₹
                      {money(
                        selectedSale
                          ?.sale
                          ?.discount_amount
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      GST
                    </span>

                    <strong>
                      ₹
                      {money(
                        selectedSale
                          ?.sale
                          ?.gst_amount
                      )}
                    </strong>

                  </div>


                  <div className="invoice-grand-total">

                    <span>
                      Grand Total
                    </span>

                    <strong>
                      ₹
                      {money(
                        selectedSale
                          ?.sale
                          ?.grand_total
                      )}
                    </strong>

                  </div>

                  <div>
                    <span>Advance Received</span>
                    <strong>-₹{money(selectedSale?.sale?.advance_amount)}</strong>
                  </div>

                  <div className="invoice-grand-total">
                    <span>Balance Due</span>
                    <strong>₹{money(Math.max(0, Number(selectedSale?.sale?.grand_total || 0) - Number(selectedSale?.sale?.advance_amount || 0)))}</strong>
                  </div>

                </div>


                <div className="invoice-payment">

                  <span>
                    Payment
                  </span>

                  <strong>
                    {
                      selectedSale
                        ?.sale
                        ?.payment_method ||
                      "-"
                    }

                    {" • "}

                    {
                      selectedSale
                        ?.sale
                        ?.payment_status ||
                      "-"
                    }
                  </strong>

                </div>

              </div>


              {/* =========================================
                  PRINT BUTTONS
                  ========================================= */}

              <div className="print-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    printBill(
                      selectedSale,
                      "NORMAL"
                    )
                  }
                >

                  <Printer
                    size={17}
                  />

                  Print Normal Bill

                </button>


                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    printBill(
                      selectedSale,
                      "GST"
                    )
                  }
                >

                  <Printer
                    size={17}
                  />

                  Print GST Bill

                </button>


                {selectedSale?.sale?.id && (

                  <select
                    value={
                      selectedSale
                        ?.sale
                        ?.payment_status ||
                      "PENDING"
                    }
                    onChange={(event) =>
                      handlePaymentUpdate(
                        selectedSale.sale.id,
                        event.target.value
                      )
                    }
                  >

                    <option value="PENDING">
                      Pending
                    </option>

                    <option value="PARTIAL">
                      Partial
                    </option>

                    <option value="PAID">
                      Paid
                    </option>

                  </select>

                )}

              </div>

            </div>

          </div>

        )}

    </div>
  );
};


export default Sales;
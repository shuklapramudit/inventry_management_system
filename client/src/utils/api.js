// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL =
  "https://inventry-management-system-1-obf0.onrender.com/api";


// =====================================================
// GET API BASE URL
// =====================================================

export const getApiBaseUrl = () => {
  return API_BASE_URL;
};


// =====================================================
// GET AUTH TOKEN
// =====================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};


// =====================================================
// API REQUEST
// =====================================================

const apiRequest = async (
  endpoint,
  options = {}
) => {

  // -------------------------------------------------
  // NORMALIZE ENDPOINT
  // -------------------------------------------------

  let cleanEndpoint =
    endpoint || "";

  if (
    !cleanEndpoint.startsWith("/")
  ) {
    cleanEndpoint =
      `/${cleanEndpoint}`;
  }


  // -------------------------------------------------
  // PREVENT DUPLICATE /api
  // -------------------------------------------------

  if (
    cleanEndpoint
      .toLowerCase()
      .startsWith("/api/")
  ) {

    cleanEndpoint =
      cleanEndpoint.substring(4);

  }


  // -------------------------------------------------
  // BUILD URL
  // -------------------------------------------------

  const url =
    `${API_BASE_URL}${cleanEndpoint}`;


  console.log(
    "API Request:",
    url
  );


  // -------------------------------------------------
  // TOKEN
  // -------------------------------------------------

  const token =
    getToken();


  // -------------------------------------------------
  // HEADERS
  // -------------------------------------------------

  const headers = {
    ...(options.headers || {}),
  };


  // -------------------------------------------------
  // FORM DATA CHECK
  // -------------------------------------------------

  const isFormData =
    options.body instanceof FormData;


  // -------------------------------------------------
  // JSON CONTENT TYPE
  // -------------------------------------------------

  if (
    !isFormData &&
    options.body !== undefined &&
    options.body !== null &&
    !headers["Content-Type"]
  ) {

    headers["Content-Type"] =
      "application/json";

  }


  // -------------------------------------------------
  // AUTHORIZATION
  // -------------------------------------------------

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  // -------------------------------------------------
  // REQUEST
  // -------------------------------------------------

  let response;

  try {

    response =
      await fetch(
        url,
        {
          ...options,
          headers,
        }
      );

  } catch (error) {

    console.error(
      "Network Error:",
      error
    );

    throw new Error(
      "Unable to connect to server. Please check your internet connection or backend server."
    );

  }


  // -------------------------------------------------
  // RESPONSE TYPE
  // -------------------------------------------------

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data = null;


  // -------------------------------------------------
  // JSON RESPONSE
  // -------------------------------------------------

  if (
    contentType.includes(
      "application/json"
    )
  ) {

    try {

      data =
        await response.json();

    } catch {

      data = null;

    }

  }


  // -------------------------------------------------
  // TEXT RESPONSE
  // -------------------------------------------------

  else {

    try {

      const text =
        await response.text();

      data = text
        ? {
            success:
              response.ok,
            message:
              text,
          }
        : null;

    } catch {

      data = null;

    }

  }


  // -------------------------------------------------
  // HTTP ERROR
  // -------------------------------------------------

  if (!response.ok) {

    const error =
      new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
      );

    error.status =
      response.status;

    error.data =
      data;


    // -------------------------------------------------
    // UNAUTHORIZED
    // -------------------------------------------------

    if (
      response.status === 401
    ) {

      error.message =
        data?.message ||
        "Authorization failed. Please login again.";

    }


    // -------------------------------------------------
    // NOT FOUND
    // -------------------------------------------------

    if (
      response.status === 404
    ) {

      error.message =
        data?.message ||
        "Requested API route was not found.";

    }


    throw error;

  }


  // -------------------------------------------------
  // SUCCESS
  // -------------------------------------------------

  return data;

};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default apiRequest;
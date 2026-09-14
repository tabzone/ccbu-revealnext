import { fetchAuthSession } from "aws-amplify/auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

const getToken = async () => {
  try {
    const session = await fetchAuthSession();

    // Use ID Token for API Gateway JWT Authorizers
    return session?.tokens?.idToken?.toString();
  } catch (error) {
    console.error(
      "Failed to get auth token:",
      error
    );
    throw error;
  }
};

const handleResponse = async (
  response
) => {
  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const lambdaGet = async (
  path
) => {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};

export const lambdaPost = async (
  path,
  payload = {}
) => {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
};

export const lambdaPut = async (
  path,
  payload = {}
) => {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
};

export const lambdaPatch = async (
  path,
  payload = {}
) => {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
};

export const lambdaDelete =
  async (path) => {
    const token =
      await getToken();

    const response = await fetch(
      `${BASE_URL}${path}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(
      response
    );
  };
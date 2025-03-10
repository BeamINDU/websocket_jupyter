// app/api/jupyter/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const JUPYTER_SERVER = "http://localhost:8888"; // Adjust to your local Jupyter server
const TOKEN =
  "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"; // Use your actual token

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  // ต้อง await params ก่อนใช้ properties
  const pathSegments = (await context.params.path) || [];
  const searchParams = request.nextUrl.searchParams;

  // Reconstruct the path with query parameters
  let url = `${JUPYTER_SERVER}/${pathSegments.join("/")}`;
  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  // Add token to the headers if not present in the URL
  const headers = new Headers(request.headers);
  if (!url.includes("token=")) {
    headers.set("Authorization", `token ${TOKEN}`);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    // Get the response data
    const data = await response.arrayBuffer();

    // Create a new response with the same status, headers, and data
    const newResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy the headers from the original response
    response.headers.forEach((value, key) => {
      // Don't copy the 'content-encoding' header to avoid issues with compression
      if (key.toLowerCase() !== "content-encoding") {
        newResponse.headers.set(key, value);
      }
    });

    // Set CORS headers
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  } catch (error) {
    console.error("Error proxying to Jupyter server:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to proxy request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  // ต้อง await params ก่อนใช้ properties
  const pathSegments = (await context.params.path) || [];
  const searchParams = request.nextUrl.searchParams;

  // Reconstruct the path with query parameters
  let url = `${JUPYTER_SERVER}/${pathSegments.join("/")}`;
  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  // Parse the request body
  let body;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    body = await request.arrayBuffer();
  }

  // Add token to the headers if not present in the URL
  const headers = new Headers(request.headers);
  if (!url.includes("token=")) {
    headers.set("Authorization", `token ${TOKEN}`);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    // Get the response data
    const data = await response.arrayBuffer();

    // Create a new response with the same status, headers, and data
    const newResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy the headers from the original response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        newResponse.headers.set(key, value);
      }
    });

    // Set CORS headers
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  } catch (error) {
    console.error("Error proxying to Jupyter server:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to proxy request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle other HTTP methods (PUT, DELETE, etc.)
export async function PUT(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  // ต้อง await params ก่อนใช้ properties
  const pathSegments = (await context.params.path) || [];
  const searchParams = request.nextUrl.searchParams;

  // Reconstruct the path with query parameters
  let url = `${JUPYTER_SERVER}/${pathSegments.join("/")}`;
  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  // Parse the request body
  let body;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    body = await request.arrayBuffer();
  }

  // Add token to the headers if not present in the URL
  const headers = new Headers(request.headers);
  if (!url.includes("token=")) {
    headers.set("Authorization", `token ${TOKEN}`);
  }

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body,
    });

    // Get the response data
    const data = await response.arrayBuffer();

    // Create a new response with the same status, headers, and data
    const newResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy the headers from the original response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        newResponse.headers.set(key, value);
      }
    });

    // Set CORS headers
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  } catch (error) {
    console.error("Error proxying to Jupyter server:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to proxy request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  // ต้อง await params ก่อนใช้ properties
  const pathSegments = (await context.params.path) || [];
  const searchParams = request.nextUrl.searchParams;

  // Reconstruct the path with query parameters
  let url = `${JUPYTER_SERVER}/${pathSegments.join("/")}`;
  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  // Add token to the headers if not present in the URL
  const headers = new Headers(request.headers);
  if (!url.includes("token=")) {
    headers.set("Authorization", `token ${TOKEN}`);
  }

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    // Get the response data
    const data = await response.arrayBuffer();

    // Create a new response with the same status, headers, and data
    const newResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy the headers from the original response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        newResponse.headers.set(key, value);
      }
    });

    // Set CORS headers
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  } catch (error) {
    console.error("Error proxying to Jupyter server:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to proxy request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

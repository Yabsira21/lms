import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  console.log("Chapa API Key exists:", !!env.CHAPA_SECRET_KEY);

  try {
    const body = await request.json();
    console.log("Received body:", JSON.stringify(body, null, 2));

    const {
      amount,
      currency,
      email,
      firstName,
      lastName,
      txRef,
      callback_url,
      return_url,
      customization,
    } = body;

    // Validate required fields
    if (!amount || !currency || !email || !firstName || !lastName) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate tx_ref if not provided (max 50 chars for Chapa)
    let finalTxRef = txRef;
    if (!finalTxRef) {
      // Generate a short unique transaction reference (max 50 chars)
      const timestamp = Date.now().toString(36); // Base36 for shorter string
      const random = Math.random().toString(36).substr(2, 6);
      finalTxRef = `tx-${timestamp}-${random}`.substr(0, 50); // Ensure max 50 chars
    } else if (finalTxRef.length > 50) {
      // Truncate if too long
      finalTxRef = finalTxRef.substr(0, 50);
    }

    // Prepare customization with validation
    let finalCustomization = {
      title: "Payment",
      description: "Payment for services",
    };

    if (customization) {
      // Clean title: max 16 chars, only allowed characters
      if (customization.title) {
        // Remove any characters that aren't letters, numbers, hyphens, underscores, spaces, or dots
        let cleanTitle = customization.title
          .replace(/[^a-zA-Z0-9\-\_\s\.]/g, "") // Remove disallowed characters
          .trim()
          .substr(0, 16); // Max 16 chars

        // If empty after cleaning, use default
        if (cleanTitle.length > 0) {
          finalCustomization.title = cleanTitle;
        }
      }

      if (customization.description) {
        finalCustomization.description = customization.description.substr(
          0,
          100
        ); // Limit description
      }
    }

    // Prepare Chapa request data
    const chapaData = {
      amount,
      currency,
      email: email.trim().toLowerCase(), // Clean email
      first_name: firstName.trim().substr(0, 50), // Limit first name
      last_name: lastName.trim().substr(0, 50), // Limit last name
      tx_ref: finalTxRef,
      callback_url:
        callback_url ||
        `${
          request.headers.get("origin") || "http://localhost:3000"
        }/api/chapa/callback`,
      return_url:
        return_url ||
        `${
          request.headers.get("origin") || "http://localhost:3000"
        }/payment/result`,
      customization: finalCustomization,
    };

    console.log("Sending to Chapa:", JSON.stringify(chapaData, null, 2));

    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      chapaData,
      {
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Chapa response:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);

      return NextResponse.json(
        {
          error: "Chapa API error",
          details: error.response.data,
          status: error.response.status,
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
// }

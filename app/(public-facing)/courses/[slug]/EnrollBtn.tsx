"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

interface EnrollButtonProps {
  courseId: string;
  price: number;
  title: string;
}

export function EnrollButton({ courseId, price, title }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clean and validate title for Chapa customization
      const cleanTitle = title
        .replace(/[^a-zA-Z0-9\-\_\s\.]/g, "") // Remove disallowed characters
        .trim()
        .substr(0, 16) // Max 16 chars for Chapa
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      // Use cleanTitle or fallback to "Enroll"
      const customizationTitle = cleanTitle.length > 0 ? cleanTitle : "Enroll";

      const customerInfo = {
        amount: price.toString(),
        currency: "ETB",
        email: "absuwood@gmail.com", // Use a valid email format
        firstName: "Test",
        lastName: "User",
        tx_ref: "tx-abebeikila-2023",
        // Don't provide txRef, let the API generate a valid one
        callback_url: `https://google.com`,
        return_url: `https://youtube.com`,
        customization: {
          title: customizationTitle,
          description: `Course payment`,
        },
      };

      console.log("Sending payment request:", customerInfo);

      const response = await axios.post("/api/chapa", customerInfo, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Payment response:", response.data);

      if (response.data?.data?.checkout_url) {
        // Redirect to Chapa checkout
        window.location.href = response.data.data.checkout_url;
      } else {
        throw new Error("No checkout URL received from Chapa");
      }
    } catch (error: any) {
      console.error("Payment initialization failed:", error);

      // Show user-friendly error message
      if (error.response?.data?.details?.message) {
        const errorMessages = Object.entries(
          error.response.data.details.message
        )
          .map(
            ([field, errors]) =>
              `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
          )
          .join("\n");
        toast.error(`${errorMessages}`);
        // alert(`Payment failed:\n${errorMessages}`);
      } else if (error.response?.data?.error) {
        // alert(`Payment failed: ${error.response.data.error}`);
        toast.error(`${error.response.data.error}`);
      } else {
        toast.error(`${error.message || "Unknown error"}`);
        // alert(`Payment failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full cursor-pointer"
      onClick={handleSubmit}
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : "Enroll Now!"}
    </Button>
  );
}

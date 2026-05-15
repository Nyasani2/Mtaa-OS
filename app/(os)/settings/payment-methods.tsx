import React from "react";

export default function PaymentMethodsSettings() {
  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1>Payment Methods</h1>

      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3>M-Pesa</h3>
        <p>Primary mobile money provider.</p>
      </div>

      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3>Bank</h3>
        <p>Linked banking infrastructure.</p>
      </div>

      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3>Crypto</h3>
        <p>Digital asset infrastructure.</p>
      </div>
    </div>
  );
}

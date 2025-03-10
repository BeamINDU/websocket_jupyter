// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// ใช้ dynamic import เพื่อให้โค้ดทำงานเฉพาะฝั่ง client
const WebSocketJupyterCell = dynamic(
  () => import("@/components/WebSocketJupyterCell"),
  { ssr: false, loading: () => <div>กำลังโหลด WebSocket Jupyter Cell...</div> }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
      >
        WebSocket Jupyter Integration
      </h1>

      <div>
        <WebSocketJupyterCell />
      </div>
    </main>
  );
}

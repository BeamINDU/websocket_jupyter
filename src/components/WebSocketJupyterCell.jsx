// components/WebSocketJupyterCell.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { KernelManager, SessionManager } from "@jupyterlab/services";
import { ServerConnection } from "@jupyterlab/services";

export default function WebSocketJupyterCell() {
  const [code, setCode] = useState('print("Hello, world!")');
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const kernelRef = useRef(null);

  // เชื่อมต่อกับ kernel เมื่อ component mount
  useEffect(() => {
    const connectToKernel = async () => {
      try {
        setStatus("Connecting...");

        const serverSettings = ServerConnection.makeSettings({
          baseUrl: "http://localhost:8888",
          wsUrl: "ws://localhost:8888",
          token:
            "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
        });

        if (!serverSettings.baseUrl || !serverSettings.wsUrl) {
          throw new Error("Server settings are not properly configured.");
        }

        const kernelManager = new KernelManager({ serverSettings });
        const sessionManager = new SessionManager({
          kernelManager,
          serverSettings,
        });

        const session = await sessionManager.startNew({
          name: "WebSocketSession",
          path: "notebook.ipynb",
          type: "notebook",
          kernel: {
            name: "python3",
          },
        });

        sessionRef.current = session;
        kernelRef.current = session.kernel;

        setStatus(`Connected to ${session.kernel.name}`);
        setOutput("Kernel ready. You can now execute code.");
        setError(null);
      } catch (err) {
        console.error("Failed to connect to kernel:", err);
        setStatus("Connection failed");
        setError(err.message || "Unknown error");
      }
    };

    connectToKernel();

    // Cleanup เมื่อ component unmount
    return () => {
      if (sessionRef.current) {
        sessionRef.current
          .shutdown()
          .catch((err) => console.error("Error shutting down session:", err));
      }
    };
  }, []);

  // ฟังก์ชันสำหรับรันโค้ด
  const executeCode = async () => {
    if (!kernelRef.current) {
      setOutput("No kernel connected. Please wait or refresh.");
      return;
    }

    setStatus("Executing...");
    setOutput("Running code...");

    try {
      // ส่งโค้ดไปรันใน kernel
      const future = kernelRef.current.requestExecute({
        code: code,
        silent: false,
        store_history: true,
      });

      let outputText = "";

      // ดักจับ IOPub messages สำหรับ outputs
      future.onIOPub = (msg) => {
        const msgType = msg.header.msg_type;

        if (msgType === "stream") {
          outputText += msg.content.text;
          setOutput(outputText);
        } else if (msgType === "execute_result" || msgType === "display_data") {
          if (msg.content.data["text/plain"]) {
            outputText += msg.content.data["text/plain"] + "\n";
            setOutput(outputText);
          }
        } else if (msgType === "error") {
          const errorText =
            msg.content.ename +
            ": " +
            msg.content.evalue +
            "\n" +
            (msg.content.traceback?.join("\n") || "");
          outputText += errorText;
          setOutput(outputText);
        }
      };

      // รอให้การทำงานเสร็จสิ้น
      await future.done;
      setStatus("Idle");
    } catch (err) {
      console.error("Execution error:", err);
      setOutput(`Error: ${err.message || "Unknown execution error"}`);
      setStatus("Error");
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "15px",
        margin: "20px 0",
        backgroundColor: "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <h3 style={{ margin: 0 }}>WebSocket Jupyter Cell</h3>
        <div>
          <button
            onClick={executeCode}
            disabled={status !== "Connected to python3" && status !== "Idle"}
            style={{
              backgroundColor:
                status !== "Connected to python3" && status !== "Idle"
                  ? "#cccccc"
                  : "#4CAF50",
              color: "white",
              border: "none",
              padding: "5px 15px",
              borderRadius: "4px",
              cursor:
                status !== "Connected to python3" && status !== "Idle"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {status === "Executing..." ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: "100%",
            height: "150px",
            fontFamily: "monospace",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "4px",
          minHeight: "50px",
          maxHeight: "300px",
          overflowY: "auto",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
        }}
      >
        {output || 'No output yet. Click "Run" to execute the code.'}
      </div>

      <div
        style={{
          fontSize: "0.8rem",
          color: "#666",
          marginTop: "10px",
        }}
      >
        Status: {status}
      </div>

      {error && (
        <div
          style={{
            marginTop: "10px",
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            borderRadius: "4px",
            padding: "10px",
            fontSize: "0.8rem",
            color: "#c62828",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

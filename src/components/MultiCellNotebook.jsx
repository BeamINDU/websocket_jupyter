"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// สร้าง component สำหรับ cell เดี่ยว
const JupyterCell = ({
  index,
  cell,
  kernelId,
  wsRef,
  cellStatus,
  setCellStatus,
  deleteCellHandler,
  moveCellUpHandler,
  moveCellDownHandler,
  insertCellHandler,
  toggleCellTypeHandler,
  isCellExecuting,
  totalCells,
}) => {
  const [output, setOutput] = useState(cell.outputs || "");

  // รัน cell
  const executeCell = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setOutput("WebSocket not connected. Please wait or refresh.");
      return;
    }

    // เคลียร์ output เดิม
    setOutput("");
    setCellStatus(index, "Executing...");

    const msgId = `execute_${Date.now()}`;

    // สร้าง execute_request message
    const executeMsg = {
      header: {
        msg_id: msgId,
        username: "user",
        session: msgId,
        msg_type: "execute_request",
        version: "5.0",
      },
      content: {
        code: cell.source,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
      },
      metadata: {},
      parent_header: {},
      channel: "shell",
    };

    console.log(`Executing cell ${index}:`, cell.source);
    wsRef.current.send(JSON.stringify(executeMsg));

    // บันทึก cell id ที่กำลังรัน
    isCellExecuting.current = index;
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "15px",
        marginBottom: "15px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              background: "#e0e0e0",
              padding: "2px 6px",
              borderRadius: "4px",
              marginRight: "10px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            Cell [{index + 1}]
          </span>
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              background: cell.cell_type === "code" ? "#e3f2fd" : "#f3e5f5",
              color: cell.cell_type === "code" ? "#0d47a1" : "#7b1fa2",
              cursor: "pointer",
            }}
            onClick={() => toggleCellTypeHandler(index)}
          >
            {cell.cell_type.charAt(0).toUpperCase() + cell.cell_type.slice(1)}
          </span>
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {cell.cell_type === "code" && (
            <button
              onClick={executeCell}
              disabled={
                !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN
              }
              style={{
                backgroundColor:
                  !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN
                    ? "#cccccc"
                    : "#4CAF50",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor:
                  !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN
                    ? "not-allowed"
                    : "pointer",
                fontSize: "12px",
              }}
            >
              {cellStatus[index] === "Executing..." ? "Running..." : "Run"}
            </button>
          )}
          <button
            onClick={() => moveCellUpHandler(index)}
            disabled={index === 0}
            style={{
              backgroundColor: index === 0 ? "#e0e0e0" : "#2196F3",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: index === 0 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            ↑
          </button>
          <button
            onClick={() => moveCellDownHandler(index)}
            disabled={index === totalCells - 1}
            style={{
              backgroundColor: index === totalCells - 1 ? "#e0e0e0" : "#2196F3",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: index === totalCells - 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            ↓
          </button>
          <button
            onClick={() => insertCellHandler(index)}
            style={{
              backgroundColor: "#FFC107",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            + Insert
          </button>
          <button
            onClick={() => deleteCellHandler(index)}
            disabled={totalCells <= 1}
            style={{
              backgroundColor: totalCells <= 1 ? "#e0e0e0" : "#F44336",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: totalCells <= 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <textarea
          value={cell.source}
          onChange={(e) => {
            cell.source = e.target.value;
            // ส่ง event เพื่อทำให้ React รีเรนเดอร์
            const event = new Event("cellSourceChanged");
            window.dispatchEvent(event);
          }}
          style={{
            width: "100%",
            height: cell.cell_type === "code" ? "150px" : "100px",
            fontFamily: "monospace",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            backgroundColor: cell.cell_type === "code" ? "#f8faff" : "#fff",
          }}
        />
      </div>

      {/* แสดงผลสำหรับ code cell */}
      {cell.cell_type === "code" && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "4px",
            minHeight: "30px",
            maxHeight: "300px",
            overflowY: "auto",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            marginTop: "10px",
          }}
        >
          {cell.outputs ? cell.outputs : "No output yet"}
        </div>
      )}

      <div
        style={{
          fontSize: "0.8rem",
          color: "#666",
          marginTop: "10px",
          display: cell.cell_type === "code" ? "block" : "none",
        }}
      >
        Status: {cellStatus[index] || "Idle"}
      </div>
    </div>
  );
};

// Component หลัก
export default function MultiCellNotebook() {
  const [cells, setCells] = useState([
    {
      id: "cell-1",
      cell_type: "code",
      source: 'print("Hello, Jupyter!")',
      outputs: "",
    },
    {
      id: "cell-2",
      cell_type: "markdown",
      source: "## This is a Markdown cell\nYou can write formatted text here.",
      outputs: "",
    },
  ]);

  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [kernelId, setKernelId] = useState("");
  const [error, setError] = useState(null);
  const [cellStatus, setCellStatus] = useState({});

  const wsRef = useRef(null);
  const isCellExecuting = useRef(null);

  useEffect(() => {
    // ติดตั้ง event listener สำหรับการอัพเดต cells
    const handleCellSourceChanged = () => {
      setCells([...cells]);
    };

    window.addEventListener("cellSourceChanged", handleCellSourceChanged);

    // 1. เริ่มด้วยการสร้าง Kernel ผ่าน REST API
    const startKernel = async () => {
      try {
        setWsStatus("Starting kernel...");

        // สร้าง kernel ผ่าน REST API
        const response = await axios.post(
          "http://localhost:8888/api/kernels",
          {},
          {
            params: {
              token:
                "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
            },
          }
        );

        const newKernelId = response.data.id;
        setKernelId(newKernelId);
        console.log("Kernel created with ID:", newKernelId);

        // 2. เมื่อได้ kernel ID แล้ว เชื่อมต่อผ่าน WebSocket
        connectWebSocket(newKernelId);
      } catch (err) {
        console.error("Failed to start kernel:", err);
        setWsStatus("Failed to start kernel");
        setError(err.message || "Unknown error");
      }
    };

    // เชื่อมต่อกับ kernel ผ่าน WebSocket
    const connectWebSocket = (id) => {
      try {
        const wsUrl = `ws://localhost:8888/api/kernels/${id}/channels?token=60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`;
        console.log("Connecting to WebSocket at:", wsUrl);

        setWsStatus(`Connecting to WebSocket...`);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsStatus("Connected");
          wsRef.current = ws;
          console.log("WebSocket connection established!");

          // ตั้งค่าสถานะเริ่มต้นของทุก cell เป็น Idle
          const initialStatus = {};
          cells.forEach((_, index) => {
            initialStatus[index] = "Idle";
          });
          setCellStatus(initialStatus);
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setWsStatus("Disconnected");
          wsRef.current = null;
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setWsStatus("WebSocket error");
          setError("WebSocket connection error");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
          } catch (e) {
            console.error("Error parsing message:", e);
          }
        };
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setWsStatus("WebSocket connection failed");
        setError(err.message || "WebSocket error");
      }
    };

    startKernel();

    // Cleanup เมื่อ component unmount
    return () => {
      window.removeEventListener("cellSourceChanged", handleCellSourceChanged);

      if (wsRef.current) {
        wsRef.current.close();
      }

      // ลบ kernel เมื่อไม่ใช้งาน
      if (kernelId) {
        axios
          .delete(`http://localhost:8888/api/kernels/${kernelId}`, {
            params: {
              token:
                "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
            },
          })
          .catch((err) => console.error("Error shutting down kernel:", err));
      }
    };
  }, [cells.length]); // dependency เป็น cells.length เพื่อให้ effect เรียกซ้ำเมื่อจำนวน cells เปลี่ยน

  // จัดการกับข้อความจาก WebSocket
  // จัดการกับข้อความจาก WebSocket
  const handleMessage = (msg) => {
    if (!msg.header) return;

    const msgType = msg.header.msg_type;
    console.log("Received message type:", msgType, msg);

    if (isCellExecuting.current !== null) {
      const cellIndex = isCellExecuting.current;

      if (msgType === "stream") {
        console.log("Stream output:", msg.content.text);

        // ใช้ functional update สำหรับ setCells
        setCells((prevCells) => {
          const newCells = [...prevCells];
          newCells[cellIndex] = {
            ...newCells[cellIndex],
            outputs:
              (newCells[cellIndex].outputs || "") + (msg.content.text || ""),
          };
          return newCells;
        });
      } else if (msgType === "execute_result" || msgType === "display_data") {
        console.log("Display data:", msg.content.data);
        if (msg.content.data && msg.content.data["text/plain"]) {
          const newCells = [...cells];
          newCells[cellIndex].outputs =
            (newCells[cellIndex].outputs || "") +
            msg.content.data["text/plain"] +
            "\n";
          setCells(newCells);
        }
      } else if (msgType === "error") {
        console.log("Error:", msg.content);
        const errorText = `${msg.content.ename}: ${
          msg.content.evalue
        }\n${msg.content.traceback.join("\n")}`;
        const newCells = [...cells];
        newCells[cellIndex].outputs =
          (newCells[cellIndex].outputs || "") + errorText;
        setCells(newCells);
      } else if (msgType === "status") {
        console.log("Status change:", msg.content.execution_state);
        if (msg.content.execution_state === "idle") {
          // การรันเสร็จสิ้น
          setCellStatus((prev) => ({
            ...prev,
            [isCellExecuting.current]: "Idle",
          }));
          // อย่ารีเซ็ต isCellExecuting ทันที ให้รอสักครู่เพื่อรับผลลัพธ์ที่อาจมาภายหลัง
          setTimeout(() => {
            isCellExecuting.current = null;
          }, 500);
        } else if (msg.content.execution_state === "busy") {
          setCellStatus((prev) => ({
            ...prev,
            [isCellExecuting.current]: "Busy",
          }));
        }
      } else if (msgType === "execute_input") {
        // แสดงข้อมูลการรัน input
        console.log("Execute input:", msg.content);
      }
    }
  };

  // ฟังก์ชันสำหรับลบ cell
  const deleteCellHandler = (index) => {
    if (cells.length <= 1) return; // ต้องมีอย่างน้อย 1 cell

    const newCells = [...cells];
    newCells.splice(index, 1);
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับย้าย cell ขึ้น
  const moveCellUpHandler = (index) => {
    if (index === 0) return; // ไม่สามารถย้าย cell แรกขึ้นได้

    const newCells = [...cells];
    [newCells[index], newCells[index - 1]] = [
      newCells[index - 1],
      newCells[index],
    ];
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับย้าย cell ลง
  const moveCellDownHandler = (index) => {
    if (index === cells.length - 1) return; // ไม่สามารถย้าย cell สุดท้ายลงได้

    const newCells = [...cells];
    [newCells[index], newCells[index + 1]] = [
      newCells[index + 1],
      newCells[index],
    ];
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับแทรก cell
  const insertCellHandler = (index) => {
    const newCells = [...cells];
    const newCell = {
      id: `cell-${Date.now()}`,
      cell_type: "code",
      source: "",
      outputs: "",
    };

    newCells.splice(index + 1, 0, newCell);
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับเพิ่ม cell ที่ท้าย
  const addCellHandler = (type = "code") => {
    const newCell = {
      id: `cell-${Date.now()}`,
      cell_type: type,
      source: type === "code" ? "" : "## New Markdown Cell",
      outputs: "",
    };

    setCells([...cells, newCell]);
  };

  // ฟังก์ชันสำหรับเปลี่ยน cell type
  const toggleCellTypeHandler = (index) => {
    const newCells = [...cells];
    newCells[index].cell_type =
      newCells[index].cell_type === "code" ? "markdown" : "code";
    newCells[index].outputs = ""; // เคลียร์ outputs เมื่อเปลี่ยน type
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับตั้งค่าสถานะของ cell
  const setCellStatusHandler = (index, status) => {
    setCellStatus((prev) => ({
      ...prev,
      [index]: status,
    }));
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "15px",
        }}
      >
        <h2 style={{ margin: 0 }}>Interactive Jupyter Notebook</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              fontSize: "14px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: wsStatus === "Connected" ? "#e8f5e9" : "#ffebee",
              color: wsStatus === "Connected" ? "#2e7d32" : "#c62828",
            }}
          >
            {wsStatus}
          </div>

          <button
            onClick={() => addCellHandler("code")}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Code
          </button>

          <button
            onClick={() => addCellHandler("markdown")}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Markdown
          </button>
        </div>
      </div>

      {/* แสดงข้อผิดพลาด */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            borderRadius: "4px",
            padding: "10px",
            fontSize: "14px",
            color: "#c62828",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* แสดง cells */}
      <div>
        {cells.map((cell, index) => (
          <JupyterCell
            key={cell.id}
            index={index}
            cell={cell}
            kernelId={kernelId}
            wsRef={wsRef}
            cellStatus={cellStatus}
            setCellStatus={setCellStatusHandler}
            deleteCellHandler={deleteCellHandler}
            moveCellUpHandler={moveCellUpHandler}
            moveCellDownHandler={moveCellDownHandler}
            insertCellHandler={insertCellHandler}
            toggleCellTypeHandler={toggleCellTypeHandler}
            isCellExecuting={isCellExecuting}
            totalCells={cells.length}
          />
        ))}
      </div>

      {/* ปุ่มเพิ่ม cell ที่ท้าย */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <button
          onClick={() => addCellHandler("code")}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Add Code Cell
        </button>

        <button
          onClick={() => addCellHandler("markdown")}
          style={{
            backgroundColor: "#9C27B0",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Add Markdown Cell
        </button>
      </div>
    </div>
  );
}

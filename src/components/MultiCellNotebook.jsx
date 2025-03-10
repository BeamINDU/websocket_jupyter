"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  KernelManager,
  SessionManager,
  ServerConnection,
} from "@jupyterlab/services";

const JupyterCell = ({
  index,
  cell,
  kernelRef,
  sessionRef,
  cellStatus,
  setCellStatus,
  deleteCellHandler,
  moveCellUpHandler,
  moveCellDownHandler,
  insertCellHandler,
  toggleCellTypeHandler,
  updateCellOutput,
  totalCells,
}) => {
  const textareaRef = useRef(null);

  // ฟังก์ชันปรับความสูงของ textarea
  const adjustTextareaHeight = (element) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  // ปรับความสูงเมื่อ source เปลี่ยนแปลง
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [cell.source]);

  // รัน cell
  const executeCell = async () => {
    if (!kernelRef.current) {
      console.log("No kernel available");
      return;
    }

    // เคลียร์ output และเปลี่ยนสถานะ
    updateCellOutput(index, "");
    setCellStatus(index, "Executing...");

    try {
      // รัน code ผ่าน kernel
      const future = kernelRef.current.requestExecute({
        code: cell.source,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
      });

      let output = "";

      // จัดการผลลัพธ์จาก IOPub messages
      future.onIOPub = (msg) => {
        const msgType = msg.header.msg_type;
        console.log("IOPub message:", msgType, msg);

        if (msgType === "stream") {
          output += msg.content.text;
          updateCellOutput(index, output);
        } else if (msgType === "execute_result" || msgType === "display_data") {
          if (msg.content.data && msg.content.data["text/plain"]) {
            output += msg.content.data["text/plain"] + "\n";
            updateCellOutput(index, output);
          }
        } else if (msgType === "error") {
          const errorText = `${msg.content.ename}: ${
            msg.content.evalue
          }\n${msg.content.traceback.join("\n")}`;
          output += errorText;
          updateCellOutput(index, output);
        }
      };

      // รอให้การทำงานเสร็จสิ้น
      await future.done;
      setCellStatus(index, "Idle");
    } catch (error) {
      console.error("Error executing cell:", error);
      updateCellOutput(index, `Error: ${error.message}`);
      setCellStatus(index, "Error");
    }
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
                !kernelRef.current || cellStatus[index] === "Executing..."
              }
              style={{
                backgroundColor:
                  !kernelRef.current || cellStatus[index] === "Executing..."
                    ? "#cccccc"
                    : "#4CAF50",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor:
                  !kernelRef.current || cellStatus[index] === "Executing..."
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
          ref={textareaRef}
          value={cell.source}
          onChange={(e) => {
            cell.source = e.target.value;
            // ปรับความสูงเมื่อพิมพ์
            adjustTextareaHeight(e.target);
            // ส่ง event เพื่อให้ React รีเรนเดอร์
            const event = new Event("cellSourceChanged");
            window.dispatchEvent(event);
          }}
          style={{
            width: "100%",
            minHeight: "30px",
            overflow: "hidden",
            resize: "none",
            fontFamily: "monospace",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            backgroundColor: cell.cell_type === "code" ? "#f8faff" : "#fff",
            lineHeight: "1.5",
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
            // ซ่อนเมื่อไม่มี output และไม่ได้กำลังรัน
            display:
              cell.outputs || cellStatus[index] === "Executing..."
                ? "block"
                : "none",
            // เพิ่ม transition เพื่อให้การแสดง/ซ่อนดูนุ่มนวล
            transition: "all 0.3s ease",
            opacity:
              cellStatus[index] === "Executing..." && !cell.outputs
                ? "0.7"
                : "1",
          }}
        >
          {cellStatus[index] === "Executing..." && !cell.outputs
            ? "Running..."
            : cell.outputs || ""}
        </div>
      )}

      {cell.cell_type === "code" && (
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
      )}
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
  ]);

  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [error, setError] = useState(null);
  const [cellStatus, setCellStatus] = useState({});

  const kernelRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    // ติดตั้ง event listener สำหรับการอัพเดต cells
    const handleCellSourceChanged = () => {
      setCells([...cells]);
    };

    window.addEventListener("cellSourceChanged", handleCellSourceChanged);

    // เชื่อมต่อกับ Jupyter kernel
    const connectToKernel = async () => {
      try {
        setConnectionStatus("Connecting...");

        // สร้าง ServerConnection settings
        const serverSettings = ServerConnection.makeSettings({
          baseUrl: "http://localhost:8888",
          wsUrl: "ws://localhost:8888",
          token:
            "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
        });

        // สร้าง kernel manager
        const kernelManager = new KernelManager({ serverSettings });

        // สร้าง session manager
        const sessionManager = new SessionManager({
          kernelManager,
          serverSettings,
        });

        console.log("Creating session...");
        // สร้าง session ใหม่
        const session = await sessionManager.startNew({
          name: "MultiCellNotebook",
          path: "notebook.ipynb",
          type: "notebook",
          kernel: {
            name: "python3",
          },
        });

        sessionRef.current = session;
        kernelRef.current = session.kernel;

        console.log("Session created:", session.id);
        console.log("Kernel ready:", session.kernel.id);

        setConnectionStatus("Connected");
        setError(null);

        // ตั้งค่าสถานะเริ่มต้นของทุก cell เป็น Idle
        const initialStatus = {};
        cells.forEach((_, index) => {
          initialStatus[index] = "Idle";
        });
        setCellStatus(initialStatus);

        // Clean up เมื่อ component unmounts
        return () => {
          console.log("Shutting down session...");
          session
            .shutdown()
            .catch((err) => console.error("Error shutting down session:", err));
        };
      } catch (err) {
        console.error("Failed to connect to kernel:", err);
        setConnectionStatus("Connection failed");
        setError(err.message || "Unknown error");
      }
    };

    connectToKernel();

    return () => {
      window.removeEventListener("cellSourceChanged", handleCellSourceChanged);
    };
  }, [cells.length]); // dependency เป็น cells.length เพื่อให้ effect เรียกซ้ำเมื่อจำนวน cells เปลี่ยน
  // State เพิ่มเติมสำหรับการจัดการการรันทั้งหมด
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningProgress, setRunningProgress] = useState({
    current: 0,
    total: 0,
  });
  const shouldCancelRef = useRef(false);

  // ฟังก์ชันสำหรับรันโค้ดทุก cell
  const executeAllCells = async () => {
    if (!kernelRef.current) {
      setError("No kernel available. Please wait for connection.");
      return;
    }

    // คัดกรองเฉพาะ code cells และสร้างอาร์เรย์ของ indices
    const codeCellIndices = cells
      .map((cell, index) => ({ cell, index }))
      .filter((item) => item.cell.cell_type === "code")
      .map((item) => item.index);

    // ถ้าไม่มี code cells เลย
    if (codeCellIndices.length === 0) {
      setError("No code cells to execute.");
      return;
    }

    // ตั้งค่าสถานะการรันและรีเซ็ตการยกเลิก
    setIsRunningAll(true);
    shouldCancelRef.current = false;
    setRunningProgress({ current: 0, total: codeCellIndices.length });

    try {
      // รันทีละ cell ตามลำดับ
      for (let i = 0; i < codeCellIndices.length; i++) {
        // ตรวจสอบว่าควรยกเลิกหรือไม่
        if (shouldCancelRef.current) {
          setError("Execution cancelled.");
          break;
        }

        const cellIndex = codeCellIndices[i];

        // อัปเดตความคืบหน้า
        setRunningProgress({ current: i + 1, total: codeCellIndices.length });

        try {
          // เคลียร์ output เดิมและเปลี่ยนสถานะ
          updateCellOutput(cellIndex, "");
          setCellStatus((prev) => ({ ...prev, [cellIndex]: "Executing..." }));

          // รันโค้ดใน cell นี้
          const future = kernelRef.current.requestExecute({
            code: cells[cellIndex].source,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
          });

          let output = "";

          // จัดการกับผลลัพธ์
          future.onIOPub = (msg) => {
            // ตรวจสอบอีกครั้งว่าควรยกเลิกหรือไม่
            if (shouldCancelRef.current) return;

            const msgType = msg.header.msg_type;

            if (msgType === "stream") {
              output += msg.content.text;
              updateCellOutput(cellIndex, output);
            } else if (
              msgType === "execute_result" ||
              msgType === "display_data"
            ) {
              if (msg.content.data && msg.content.data["text/plain"]) {
                output += msg.content.data["text/plain"] + "\n";
                updateCellOutput(cellIndex, output);
              }
            } else if (msgType === "error") {
              const errorText = `${msg.content.ename}: ${
                msg.content.evalue
              }\n${msg.content.traceback.join("\n")}`;
              output += errorText;
              updateCellOutput(cellIndex, output);

              // ตัวเลือก: ถ้าต้องการหยุดเมื่อเกิดข้อผิดพลาด
              // shouldCancelRef.current = true;
            }
          };

          // รอให้การรัน cell นี้เสร็จสิ้นก่อนไปรัน cell ถัดไป
          await future.done;
          setCellStatus((prev) => ({ ...prev, [cellIndex]: "Idle" }));
        } catch (error) {
          console.error(`Error executing cell ${cellIndex}:`, error);
          updateCellOutput(cellIndex, `Error: ${error.message}`);
          setCellStatus((prev) => ({ ...prev, [cellIndex]: "Error" }));

          // ตัวเลือก: ถ้าต้องการหยุดเมื่อเกิดข้อผิดพลาด
          // shouldCancelRef.current = true;
        }
      }
    } finally {
      // คืนค่าสถานะเมื่อเสร็จสิ้นหรือยกเลิก
      setIsRunningAll(false);
      setRunningProgress({ current: 0, total: 0 });
    }
  };

  // ฟังก์ชันสำหรับหยุดการรัน
  const stopExecution = () => {
    shouldCancelRef.current = true;
    //setError("Stopping execution. Please wait for current cell to complete...");

    // ถ้าต้องการหยุดการทำงานของ kernel ทันที (interrupt kernel)
    if (kernelRef.current) {
      try {
        kernelRef.current
          .interrupt()
          .then(() => {
            console.log("Kernel interrupted successfully");
          })
          .catch((err) => {
            console.error("Error interrupting kernel:", err);
          });
      } catch (error) {
        console.error("Error trying to interrupt kernel:", error);
      }
    }
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
  const deleteCellHandler = (index) => {
    if (cells.length <= 1) return; // Always keep at least one cell

    const newCells = [...cells];
    newCells.splice(index, 1);
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
    newCells[index].outputs = "";
    setCells(newCells);
  };

  // ฟังก์ชันสำหรับตั้งค่าสถานะของ cell
  const setCellStatusHandler = (index, status) => {
    setCellStatus((prev) => ({
      ...prev,
      [index]: status,
    }));
  };

  // ฟังก์ชันสำหรับอัปเดต output ของ cell
  const updateCellOutput = (index, output) => {
    const newCells = [...cells];
    newCells[index].outputs = output;
    setCells(newCells);
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
        <h2 style={{ margin: 0 }}>Jupyter Notebook</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              fontSize: "14px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor:
                connectionStatus === "Connected" ? "#e8f5e9" : "#ffebee",
              color: connectionStatus === "Connected" ? "#2e7d32" : "#c62828",
            }}
          >
            {connectionStatus}
          </div>
          {/* เพิ่มปุ่ม Run All */}
          <button
            onClick={isRunningAll ? stopExecution : executeAllCells}
            disabled={connectionStatus !== "Connected"}
            style={{
              backgroundColor:
                connectionStatus !== "Connected"
                  ? "#cccccc"
                  : isRunningAll
                  ? "#F44336"
                  : "#FF5722",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor:
                connectionStatus !== "Connected" ? "not-allowed" : "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {isRunningAll ? (
              <>
                <span style={{ fontSize: "16px" }}>⏹</span> Stop
              </>
            ) : (
              <>
                <span style={{ fontSize: "16px" }}>▶</span> Run All
              </>
            )}
          </button>

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
      {runningProgress.total > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            border: "1px solid #e0e0e0",
          }}
        >
          <div
            style={{
              marginBottom: "5px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Running cell {runningProgress.current} of {runningProgress.total}
              ...
            </span>
            <span>
              {Math.round(
                (runningProgress.current / runningProgress.total) * 100
              )}
              %
            </span>
          </div>
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${
                  (runningProgress.current / runningProgress.total) * 100
                }%`,
                backgroundColor: "#4CAF50",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
      {/* แสดง cells */}
      <div>
        {cells.map((cell, index) => (
          <JupyterCell
            key={cell.id}
            index={index}
            cell={cell}
            kernelRef={kernelRef}
            sessionRef={sessionRef}
            cellStatus={cellStatus}
            setCellStatus={setCellStatusHandler}
            deleteCellHandler={deleteCellHandler}
            moveCellUpHandler={moveCellUpHandler}
            moveCellDownHandler={moveCellDownHandler}
            insertCellHandler={insertCellHandler}
            toggleCellTypeHandler={toggleCellTypeHandler}
            updateCellOutput={updateCellOutput}
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

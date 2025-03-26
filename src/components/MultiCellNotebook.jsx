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
  updateCellOutput,
  updateCellContent,
  totalCells,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isDragging,
}) => {
  const cellAttributes = {
    draggable: true,
    onDragStart: (e) => handleDragStart(e, index),
    onDragOver: (e) => handleDragOver(e, index),
    onDrop: (e) => handleDrop(e, index),
    onDragLeave: (e) => handleDragLeave(e),
    style: {
      cursor: "move",
    },
  };
  function ansiToHtml(text) {
    if (typeof text !== "string") return text;

    return (
      text
        // สีข้อความ
        .replace(/\u001b\[0;30m/g, '<span style="color: black">')
        .replace(/\u001b\[0;31m/g, '<span style="color: red">')
        .replace(/\u001b\[0;32m/g, '<span style="color: green">')
        .replace(/\u001b\[0;33m/g, '<span style="color: yellow">')
        .replace(/\u001b\[0;34m/g, '<span style="color: blue">')
        .replace(/\u001b\[0;35m/g, '<span style="color: magenta">')
        .replace(/\u001b\[0;36m/g, '<span style="color: cyan">')
        .replace(/\u001b\[0;37m/g, '<span style="color: white">')

        // สีข้อความแบบเข้ม (bright)
        .replace(
          /\u001b\[1;30m/g,
          '<span style="color: black; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;31m/g,
          '<span style="color: red; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;32m/g,
          '<span style="color: green; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;33m/g,
          '<span style="color: yellow; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;34m/g,
          '<span style="color: blue; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;35m/g,
          '<span style="color: magenta; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;36m/g,
          '<span style="color: cyan; font-weight: bold">'
        )
        .replace(
          /\u001b\[1;37m/g,
          '<span style="color: white; font-weight: bold">'
        )

        // สีพื้นหลัง
        .replace(/\u001b\[40m/g, '<span style="background-color: black">')
        .replace(/\u001b\[41m/g, '<span style="background-color: red">')
        .replace(/\u001b\[42m/g, '<span style="background-color: green">')
        .replace(/\u001b\[43m/g, '<span style="background-color: yellow">')
        .replace(/\u001b\[44m/g, '<span style="background-color: blue">')
        .replace(/\u001b\[45m/g, '<span style="background-color: magenta">')
        .replace(/\u001b\[46m/g, '<span style="background-color: cyan">')
        .replace(/\u001b\[47m/g, '<span style="background-color: white">')

        // รหัสปิด
        .replace(/\u001b\[0m/g, "</span>")

        // รหัสพิเศษสำหรับ cursor control (ใช้ในเทอร์มินัล)
        .replace(/\u001b\[\d+m/g, "") // ลบรหัสที่ไม่รู้จักทั้งหมด
        .replace(/\u001b\[\d+;\d+m/g, "")
    ); // ลบรหัสรูปแบบ [number;number]m
  }

  // นอกจากนี้ ควรปรับส่วนตรวจจับ error ให้ครอบคลุมมากขึ้น
  const hasError = (output) => {
    if (!output) return false;

    return (
      output.includes("Error:") ||
      output.includes("NameError") ||
      output.includes("SyntaxError") ||
      output.includes("TypeError") ||
      output.includes("ValueError") ||
      output.includes("ImportError") ||
      output.includes("IndentationError") ||
      output.includes("AttributeError")
    );
  };
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
    console.log(`Executing cell ${index} with content: "${cell.source}"`);
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
        console.log(`Cell ${index} received message:`, msgType, msg);

        if (msgType === "stream") {
          output += msg.content.text;
          console.log(`Cell ${index} updating output to: "${output}"`);
          updateCellOutput(index, output);
        } else if (msgType === "execute_result" || msgType === "display_data") {
          if (msg.content.data && msg.content.data["text/plain"]) {
            output += msg.content.data["text/plain"] + "\n";
            console.log(`Cell ${index} updating output to: "${output}"`);
            updateCellOutput(index, output);
          }
        } else if (msgType === "error") {
          const errorText = `${msg.content.ename}: ${
            msg.content.evalue
          }\n${msg.content.traceback.join("\n")}`;
          output += ansiToHtml(errorText);
          console.log(`Cell ${index} updating error output`);
          updateCellOutput(index, output);
        }
      };

      // รอให้การทำงานเสร็จสิ้น
      await future.done;
      console.log(
        `Cell ${index} execution completed, final output: "${output}"`
      );
      setCellStatus(index, "Idle");
    } catch (error) {
      console.error(`Error executing cell ${index}:`, error);
      updateCellOutput(index, ansiToHtml(`Error: ${error.message}`));
      setCellStatus(index, "Error");
    }
  };

  return (
    <div
      {...cellAttributes}
      id={`cell-${cell.id}`}
      style={{
        border: "1px solid #fffff",
        borderRadius: "4px",
        padding: "15px",
        marginBottom: "15px",
        backgroundColor: "#fffff",
        opacity: isDragging ? 0.7 : 1,
        transition: "box-shadow 0.3s ease-in-out",
      }}
    >
      {/* ส่วนหัวของ cell */}
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

      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            cursor: "move",
            marginRight: "8px",
            fontSize: "32px",
            color: "#aaa",
            opacity: 0.7,
            userSelect: "none",
            paddingTop: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // จัดให้อยู่ตรงกลางในแนวนอน
            width: "24px", // กำหนดความกว้างชัดเจน
            height: "auto", // กำหนดความสูงให้เท่ากับพื้นที่พิมพ์
          }}
          title="Drag to reorder"
        >
          ⠿
        </div>
        <textarea
          ref={textareaRef}
          value={cell.source}
          onChange={(e) => {
            updateCellContent(index, e.target.value);
            adjustTextareaHeight(e.target);
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
            backgroundColor: hasError(cell.outputs) ? "#ffebee" : "#ffff",
            padding: "10px",
            borderRadius: "4px",
            border: hasError(cell.outputs) ? "1px solid #ffcdd2" : "none",
            minHeight: "30px",
            maxHeight: "300px",
            overflowY: "auto",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            marginTop: "10px",
            // แก้ไขเงื่อนไขการแสดงผล - แสดงผลเสมอแม้ว่า output จะเป็นสตริงว่าง
            display: "block",
            visibility:
              cell.outputs || cellStatus[index] === "Executing..."
                ? "visible"
                : "hidden",
            transition: "all 0.3s ease",
            opacity:
              cellStatus[index] === "Executing..." && !cell.outputs
                ? "0.7"
                : "1",
          }}
          dangerouslySetInnerHTML={{
            __html:
              cellStatus[index] === "Executing..." && !cell.outputs
                ? "Running..."
                : cell.outputs || "", // ป้องกันกรณี cell.outputs เป็น null หรือ undefined
          }}
        />
      )}

      {/*      {cell.cell_type === "code" && (
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
      )}  */}
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
  const [draggedCellIndex, setDraggedCellIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [error, setError] = useState(null);
  const [cellStatus, setCellStatus] = useState({});

  const kernelRef = useRef(null);
  const sessionRef = useRef(null);
  // ฟังก์ชันสำหรับจัดการ drag and drop
  const handleDragStart = (e, index) => {
    setDraggedCellIndex(index);
    setDropTargetIndex(null);
    setDropPosition(null);
    // ตั้งข้อมูลที่จะถูกส่งไปกับการลาก
    e.dataTransfer.setData("text/plain", index);
    // ปรับแต่งภาพที่แสดงขณะลาก
    if (e.dataTransfer.setDragImage) {
      const dragElement = document.createElement("div");
      dragElement.textContent = `Cell ${index + 1}`;
      dragElement.style.padding = "5px 10px";
      dragElement.style.background = "#e3f2fd";
      dragElement.style.border = "1px solid #2196F3";
      dragElement.style.borderRadius = "4px";
      dragElement.style.position = "absolute";
      dragElement.style.top = "-1000px";
      document.body.appendChild(dragElement);

      e.dataTransfer.setDragImage(dragElement, 0, 0);

      // ลบหลังจากใช้งาน
      setTimeout(() => {
        document.body.removeChild(dragElement);
      }, 0);
    }
  };

  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // ถ้าลากและวางที่เดียวกัน ไม่ต้องแสดงตัวบ่งชี้
    if (draggedCellIndex === overIndex) {
      setDropTargetIndex(null);
      setDropPosition(null);
      return;
    }

    // คำนวณตำแหน่งของเมาส์เทียบกับองค์ประกอบที่เมาส์อยู่เหนือ
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // กำหนดตำแหน่งที่จะวาง
    const newPosition = y < height / 2 ? "before" : "after";

    setDropTargetIndex(overIndex);
    setDropPosition(newPosition);
  };
  const handleDragLeave = () => {
    // ซ่อนตัวบ่งชี้เมื่อเมาส์ออกจากเซลล์
    setDropTargetIndex(null);
    setDropPosition(null);
  };
  const renderDropIndicator = (index) => {
    console.log(
      `Rendering indicator for index ${index}, dropTargetIndex: ${dropTargetIndex}, dropPosition: ${dropPosition}, draggedCellIndex: ${draggedCellIndex}`
    );

    if (dropTargetIndex !== index || draggedCellIndex === index) {
      return null;
    }

    return (
      <div
        style={{
          height: "4px",
          backgroundColor: "#2196F3",
          position: "absolute",
          left: "0",
          right: "0",
          zIndex: 10,
          // ตำแหน่งของตัวบ่งชี้ ขึ้นอยู่กับว่าจะวางก่อนหรือหลังเซลล์
          [dropPosition === "before" ? "top" : "bottom"]: "0",
        }}
      />
    );
  };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    // ซ่อนตัวบ่งชี้หลังจากวาง
    setDropTargetIndex(null);
    setDropPosition(null);

    // ไม่ทำอะไรถ้าลากและวางที่เดียวกัน
    if (draggedCellIndex === dropIndex) {
      setDraggedCellIndex(null);
      return;
    }

    // ปรับตำแหน่งที่จะวางตามตำแหน่งของเมาส์
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // คำนวณตำแหน่งที่ควรจะวาง
    let actualDropIndex = dropIndex;

    // ถ้าวางหลังเซลล์และไม่ใช่เซลล์สุดท้าย ให้เพิ่มตำแหน่งขึ้น 1
    if (y >= height / 2) {
      actualDropIndex += 1;
    }

    // ปรับตำแหน่งหากลากจากตำแหน่งที่น้อยกว่า
    if (draggedCellIndex < actualDropIndex) {
      actualDropIndex -= 1;
    }

    // สร้าง array ใหม่และจัดลำดับใหม่
    const newCells = [...cells];
    const draggedCell = newCells[draggedCellIndex];

    // ลบเซลล์ที่ลากออก
    newCells.splice(draggedCellIndex, 1);

    // แทรกเซลล์ที่ตำแหน่งใหม่
    newCells.splice(actualDropIndex, 0, draggedCell);

    // อัปเดต state
    setCells(newCells);
    setDraggedCellIndex(null);

    // แสดงข้อความยืนยัน
    setError(null); // ล้างข้อความ error ถ้ามี
  };
  const updateCellContent = (index, content) => {
    const newCells = [...cells];
    newCells[index] = {
      ...newCells[index],
      source: content,
    };
    setCells(newCells);
  };
  useEffect(() => {
    // ติดตั้ง event listener สำหรับการอัพเดต cells
    const handleCellSourceChanged = () => {};

    window.addEventListener("cellSourceChanged", handleCellSourceChanged);

    // เชื่อมต่อกับ Jupyter kernel
    const connectToKernel = async () => {
      try {
        setConnectionStatus("Connecting...");

        // สร้าง ServerConnection settings
        const serverSettings = ServerConnection.makeSettings({
          baseUrl: "http://54.169.192.189:8888",
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
  // ฟังก์ชันสำหรับรันโค้ดทุก cell ที่ปรับปรุงแล้ว
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

    // รีเซ็ต kernel ก่อนรันทั้งหมด
    setError("Resetting kernel before execution...");
    const resetSuccess = await resetKernel();

    if (!resetSuccess) {
      setError("Failed to reset kernel. Execution aborted.");
      return;
    }

    // ตั้งค่าสถานะการรันและรีเซ็ตการยกเลิก
    setIsRunningAll(true);
    shouldCancelRef.current = false;
    setRunningProgress({ current: 0, total: codeCellIndices.length });
    setError(null); // ล้างข้อความ error เก่า

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
          console.log(
            `[executeAllCells] Executing cell ${cellIndex} with content: "${cells[cellIndex].source}"`
          );
          // รันโค้ดใน cell นี้
          const future = kernelRef.current.requestExecute({
            code: cells[cellIndex].source,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
          });

          let output = "";
          let hasErrorOccurred = false; // ตัวแปรเพื่อตรวจจับว่ามี error เกิดขึ้นหรือไม่

          // จัดการกับผลลัพธ์
          future.onIOPub = (msg) => {
            // ตรวจสอบอีกครั้งว่าควรยกเลิกหรือไม่
            if (shouldCancelRef.current) return;

            const msgType = msg.header.msg_type;
            console.log(
              `[executeAllCells] Cell ${cellIndex} received message:`,
              msgType,
              msg
            );

            if (msgType === "stream") {
              output += msg.content.text;
              console.log(
                `[executeAllCells] Cell ${cellIndex} stream output: "${msg.content.text}"`
              );
              updateCellOutput(cellIndex, output);
            } else if (
              msgType === "execute_result" ||
              msgType === "display_data"
            ) {
              if (msg.content.data && msg.content.data["text/plain"]) {
                output += msg.content.data["text/plain"] + "\n";
                console.log(
                  `[executeAllCells] Cell ${cellIndex} execute_result output: "${msg.content.data["text/plain"]}"`
                );
                updateCellOutput(cellIndex, output);
              }
            } else if (msgType === "error") {
              hasErrorOccurred = true; // ตั้งค่าตัวแปรเมื่อพบ error

              // สร้างข้อความ error ในรูปแบบเดียวกับ executeCell
              const errorText = `${msg.content.ename}: ${
                msg.content.evalue
              }\n${msg.content.traceback.join("\n")}`;
              console.log(
                `[executeAllCells] Cell ${cellIndex} error raw text:`,
                errorText
              );

              // ใช้ ansiToHtml ในการแปลง ANSI codes ให้กลายเป็น HTML
              const formattedError = ansiToHtml(errorText);
              console.log(
                `[executeAllCells] Cell ${cellIndex} error formatted HTML:`,
                formattedError
              );

              // อัปเดต output โดยใช้ข้อความ error ที่แปลงแล้ว
              output = formattedError; // แทนที่ output ด้วยข้อความ error แทนการต่อท้าย
              console.log(
                `[executeAllCells] Cell ${cellIndex} setting error output, length:`,
                output.length
              );

              // อัปเดต output ของ cell
              updateCellOutput(cellIndex, output);

              // หยุดการทำงานทันทีเมื่อเจอ error
              shouldCancelRef.current = true;

              // แสดงข้อความ error ที่ชัดเจน
              const errorMessage = `Execution stopped at cell ${
                cellIndex + 1
              } due to error: ${msg.content.ename}: ${msg.content.evalue}`;
              setError(errorMessage);

              // แสดง cell ที่เกิด error ให้ชัดเจน โดยการ scroll ไปที่ cell นั้น
              const cellElement = document.getElementById(
                `cell-${cells[cellIndex].id}`
              );
              if (cellElement) {
                cellElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });

                // เพิ่ม highlight ให้กับ cell ที่เกิด error
                cellElement.style.boxShadow = "0 0 10px #ff0000";
                // ลบ highlight หลังจาก 3 วินาที
                setTimeout(() => {
                  cellElement.style.boxShadow = "none";
                }, 3000);
              }
            }
          };

          // รอให้การรัน cell นี้เสร็จสิ้นก่อนไปรัน cell ถัดไป
          await new Promise((resolve) => {
            future.done
              .then(() => {
                console.log(
                  `[executeAllCells] Cell ${cellIndex} execution completed, final output: "${output}"`
                );
                setCellStatus((prev) => ({ ...prev, [cellIndex]: "Idle" }));
                resolve();
              })
              .catch((error) => {
                console.error(
                  `[executeAllCells] Error in future.done for cell ${cellIndex}:`,
                  error
                );
                setCellStatus((prev) => ({ ...prev, [cellIndex]: "Error" }));
                resolve(); // ยังคง resolve เพื่อให้ลูปทำงานต่อไป
              });
          });

          // ตรวจสอบอีกครั้งหลังจาก future.done หากมี error ให้หยุดการทำงาน
          if (hasErrorOccurred) {
            console.log(
              `[executeAllCells] Error detected in cell ${cellIndex}, stopping execution`
            );
            break;
          }
        } catch (error) {
          console.error(
            `[executeAllCells] Error executing cell ${cellIndex}:`,
            error
          );
          updateCellOutput(cellIndex, ansiToHtml(`Error: ${error.message}`));
          setCellStatus((prev) => ({ ...prev, [cellIndex]: "Error" }));

          // หยุดการทำงานทันทีเมื่อเจอข้อผิดพลาด
          const errorMessage = `Execution stopped at cell ${
            cellIndex + 1
          } due to error: ${error.message}`;
          setError(errorMessage);

          // แสดง cell ที่เกิด error ให้ชัดเจน
          const cellElement = document.getElementById(
            `cell-${cells[cellIndex].id}`
          );
          if (cellElement) {
            cellElement.scrollIntoView({ behavior: "smooth", block: "center" });
            cellElement.style.boxShadow = "0 0 10px #ff0000";
            setTimeout(() => {
              cellElement.style.boxShadow = "none";
            }, 3000);
          }

          break; // หยุดการวนลูปทันที
        }
      }
    } finally {
      // คืนค่าสถานะเมื่อเสร็จสิ้นหรือยกเลิก
      setIsRunningAll(false);
      setRunningProgress({ current: 0, total: 0 });
    }
  };
  const resetKernel = async () => {
    if (!kernelRef.current) {
      setError("No kernel available. Please wait for connection.");
      return false;
    }

    try {
      setConnectionStatus("Restarting kernel...");

      // ล้าง output ของทุก cell
      const newCells = [...cells];
      newCells.forEach((cell) => {
        cell.outputs = "";
      });
      setCells(newCells);

      // รีเซ็ตสถานะของทุก cell
      const initialStatus = {};
      cells.forEach((_, index) => {
        initialStatus[index] = "Idle";
      });
      setCellStatus(initialStatus);

      // รีสตาร์ท kernel
      await kernelRef.current.restart();
      console.log("Kernel restarted successfully");

      setConnectionStatus("Connected");
      setError(null);
      return true;
    } catch (error) {
      console.error("Error restarting kernel:", error);
      setConnectionStatus("Connection error");
      setError(`Failed to restart kernel: ${error.message}`);
      return false;
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

  const addCellHandler = (type = "code") => {
    const newCell = {
      id: `cell-${Date.now()}`,
      cell_type: type,
      source: type === "code" ? "" : "## New Markdown Cell",
      outputs: "",
    };

    setCells([...cells, newCell]);
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
    console.log(
      `updateCellOutput called for cell ${index} with output: "${output}"`
    );

    // สร้าง array ใหม่เพื่อหลีกเลี่ยงการแก้ไขข้อมูลโดยตรง
    const newCells = [...cells];

    // ตรวจสอบว่า index ถูกต้องหรือไม่
    if (index < 0 || index >= newCells.length) {
      console.error(
        `Invalid cell index: ${index}, cells length: ${newCells.length}`
      );
      return;
    }

    // ตรวจสอบว่า cell มีอยู่จริงหรือไม่
    if (!newCells[index]) {
      console.error(`Cell at index ${index} is undefined`);
      return;
    }

    // อัปเดต output
    newCells[index].outputs = output;

    // เรียกใช้ setCells เพื่ออัปเดต state
    setCells(newCells);

    // ตรวจสอบหลังจากอัปเดต
    setTimeout(() => {
      console.log(`Cell ${index} output after update:`, cells[index]?.outputs);
    }, 0);
  };

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#ffffff",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* ส่วนหัวของ notebook */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0 }}>Jupyter Notebook</h3>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor:
                connectionStatus === "Connected" ? "#e8f5e9" : "#ffebee",
              color: connectionStatus === "Connected" ? "#2e7d32" : "#c62828",
            }}
          >
            {connectionStatus}
          </div>

          <button
            onClick={isRunningAll ? stopExecution : executeAllCells}
            disabled={connectionStatus !== "Connected"}
            style={{
              backgroundColor: "#337ab7",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "3px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Run All
          </button>

          <button
            onClick={() => addCellHandler("code")}
            style={{
              backgroundColor: "#5cb85c",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "3px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* แสดงข้อผิดพลาด */}
      {error && (
        <div
          style={{
            marginBottom: "15px",
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            borderRadius: "3px",
            padding: "8px",
            fontSize: "12px",
            color: "#c62828",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Container สำหรับ cells ทั้งหมด - เป็น div เดียวที่ครอบทุก cells */}
      <div
        className="jp-Notebook-container"
        style={{
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {cells.map((cell, index) => (
          <div key={cell.id} style={{ position: "relative" }}>
            {renderDropIndicator(index)}
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
              updateCellOutput={updateCellOutput}
              updateCellContent={updateCellContent}
              totalCells={cells.length}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              isDragging={draggedCellIndex === index}
            />
          </div>
        ))}
        {/* ตัวบ่งชี้สำหรับกรณีที่จะวางเป็นเซลล์สุดท้าย */}
        {dropTargetIndex === cells.length - 1 &&
          dropPosition === "after" &&
          draggedCellIndex !== cells.length - 1 &&
          !cells.some((cell, idx) => renderDropIndicator(idx) !== null) && (
            <div
              style={{
                height: "4px",
                backgroundColor: "#2196F3",
                marginTop: "-4px",
              }}
            />
          )}
      </div>
    </div>
  );
}

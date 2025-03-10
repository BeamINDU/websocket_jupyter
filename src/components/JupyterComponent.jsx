"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Polyfills สำหรับ browser environment
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
  window.process = window.process || require("process");
  window.global = window;
}

const JupyterCell = dynamic(
  () => import("@datalayer/jupyter-react").then((mod) => mod.Cell),
  { ssr: false, loading: () => <div>กำลังโหลด Cell...</div> }
);

const JupyterProvider = dynamic(
  () => import("@datalayer/jupyter-react").then((mod) => mod.Jupyter),
  { ssr: false, loading: () => <div>กำลังโหลด Provider...</div> }
);

export default function JupyterComponent() {
  const [isMounted, setIsMounted] = useState(false);
  const cellRef = useRef(null);
  const [cellState, setCellState] = useState({
    source: 'print("สวัสดี! นี่คือ Jupyter cell")',
    outputs: [],
    hasBeenExecuted: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [kernelId, setKernelId] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    // เพิ่ม CSS สำหรับ Jupyter Cell และปุ่มต่างๆ
    const style = document.createElement("style");
    style.innerHTML = `
      .jp-Cell {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      .jp-InputArea-editor {
        background-color: #f5f5f5 !important;
        color: #000000 !important;
        pointer-events: auto !important;
      }
      .jp-OutputArea-output {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      .jp-RenderedText {
        color: #000000 !important;
      }
      .p-Widget {
        background-color: #ffffff !important;
        pointer-events: auto !important;
      }
      .cm-editor {
        background-color: #f8f8f8 !important;
        color: #000000 !important;
        pointer-events: auto !important;
      }
      .cm-line {
        color: #000000 !important;
      }
      .cm-content {
        background-color: #f8f8f8 !important;
        pointer-events: auto !important;
      }
      /* สำคัญมาก: ทำให้รับการพิมพ์ได้ */
      .cm-content, .cm-gutter, .cm-scroller, .cm-cursor-primary, .cm-editor {
        pointer-events: auto !important;
        user-select: text !important;
        -webkit-user-select: text !important;
      }
      /* ทำให้เห็น cursor */
      .cm-cursor {
        border-left-color: black !important;
        border-left-width: 2px !important;
        display: block !important;
      }
      /* ทำให้ปุ่มต่างๆ สามารถคลิกได้ */
      button, .jp-ToolbarButton, .jp-RunIcon {
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      /* เน้นสีของปุ่ม Run */
      .jp-RunIcon {
        background-color: #4CAF50 !important;
        border-radius: 4px !important;
      }
    `;
    document.head.appendChild(style);

    // ติดตั้งตัวจับเหตุการณ์สำหรับข้อความล็อกที่เกี่ยวข้องกับ Jupyter
    const originalConsoleLog = console.log;
    console.log = function () {
      if (
        arguments[0] &&
        typeof arguments[0] === "string" &&
        (arguments[0].includes("jupyter") || arguments[0].includes("kernel"))
      ) {
        console.warn("JUPYTER LOG:", ...arguments);
      }
      // ตรวจสอบข้อความล็อกเพื่อดึง kernel ID
      if (
        arguments[0] &&
        typeof arguments[0] === "string" &&
        arguments[0].includes("Kernel Details")
      ) {
        try {
          const details = arguments[1];
          if (details && details.id) {
            setKernelId(details.id);
            console.warn("KERNEL ID FOUND:", details.id);
          }
          if (details && details.sessionId) {
            setSessionId(details.sessionId);
            console.warn("SESSION ID FOUND:", details.sessionId);
          }
        } catch (e) {
          console.error("Error parsing kernel details:", e);
        }
      }
      return originalConsoleLog.apply(console, arguments);
    };

    setIsMounted(true);

    // ทำให้ focus ที่เซลล์หลังจากโหลดเสร็จ
    const timer = setTimeout(() => {
      if (cellRef.current) {
        try {
          // พยายาม focus ที่ editor
          const editorElement = document.querySelector(".cm-editor");
          if (editorElement) {
            editorElement.focus();
            console.log("Focused on editor");
          }
        } catch (e) {
          console.error("Error focusing:", e);
        }
      }
    }, 1000);

    return () => {
      document.head.removeChild(style);
      clearTimeout(timer);
      console.log = originalConsoleLog;
    };
  }, []);

  // ฟังก์ชันสำหรับรีเซ็ตเซลล์
  const resetCell = () => {
    setCellState({
      source: 'print("สวัสดี! นี่คือ Jupyter cell")',
      outputs: [],
      hasBeenExecuted: false,
    });
    setErrorMessage("");
  };

  // ฟังก์ชันสำหรับรันโค้ดโดยตรงผ่าน Jupyter API
  const executeCodeDirectly = async () => {
    if (!kernelId) {
      setErrorMessage(
        "ไม่พบ Kernel ID กรุณาตรวจสอบว่าเคอร์เนลเชื่อมต่อสำเร็จแล้ว"
      );
      return;
    }

    try {
      setIsExecuting(true);
      setErrorMessage("");

      console.log(`กำลังรันโค้ดโดยตรงกับ Kernel ID: ${kernelId}`);

      // แก้ไข URL ให้ถูกต้อง - เปลี่ยนจาก /api/jupyter/api/kernels/ เป็น /api/jupyter/kernels/
      const response = await fetch(`/api/jupyter/api/kernels/{id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: cellState.source,
          silent: false,
          store_history: true,
          user_expressions: {},
          allow_stdin: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `การเรียก API ผิดพลาด: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("ผลลัพธ์การรันโค้ด:", result);

      // อัพเดทผลลัพธ์
      if (result.content) {
        // ถ้ามีข้อมูลผลลัพธ์
        if (result.content.data && result.content.data["text/plain"]) {
          setCellState((prev) => ({
            ...prev,
            outputs: [
              {
                output_type: "execute_result",
                data: { "text/plain": result.content.data["text/plain"] },
              },
            ],
            hasBeenExecuted: true,
          }));
        }
        // ถ้ามีข้อความเอาท์พุท
        else if (result.content.text) {
          setCellState((prev) => ({
            ...prev,
            outputs: [
              {
                output_type: "stream",
                name: "stdout",
                text: result.content.text,
              },
            ],
            hasBeenExecuted: true,
          }));
        }
      }
      // ถ้ามีเอาท์พุทโดยตรง
      else if (result.outputs && result.outputs.length > 0) {
        setCellState((prev) => ({
          ...prev,
          outputs: result.outputs,
          hasBeenExecuted: true,
        }));
      } else {
        setCellState((prev) => ({
          ...prev,
          outputs: [
            {
              output_type: "stream",
              name: "stdout",
              text: "โค้ดทำงานแล้ว แต่ไม่มีเอาท์พุทที่แสดงได้",
            },
          ],
          hasBeenExecuted: true,
        }));
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการรันโค้ด:", error);
      setErrorMessage(`เกิดข้อผิดพลาดในการรันโค้ด: ${error.message}`);

      // แสดงข้อผิดพลาดในเอาท์พุท
      setCellState((prev) => ({
        ...prev,
        outputs: [
          {
            output_type: "error",
            ename: "Error",
            evalue: error.message,
            traceback: [error.stack || "ไม่มีข้อมูล traceback"],
          },
        ],
        hasBeenExecuted: true,
      }));
    } finally {
      setIsExecuting(false);
    }
  };

  // ลองวิธีรันผ่าน Session API
  const executeViaSession = async () => {
    if (!sessionId || !kernelId) {
      setErrorMessage("ไม่พบ Session ID หรือ Kernel ID");
      return;
    }

    try {
      setIsExecuting(true);
      setErrorMessage("");

      console.log(`กำลังรันโค้ดผ่าน Session API: ${sessionId}`);

      // ใช้ session API แทน
      const response = await fetch(
        `/api/jupyter/api/sessions/${sessionId}/kernel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "execute",
            code: cellState.source,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `การเรียก Session API ผิดพลาด: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("ผลลัพธ์การรันโค้ดผ่าน Session:", result);

      // อัพเดทสถานะ
      setCellState((prev) => ({
        ...prev,
        hasBeenExecuted: true,
        outputs: [
          {
            output_type: "stream",
            name: "stdout",
            text: "รันโค้ดผ่าน Session API สำเร็จ",
          },
        ],
      }));
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการรันโค้ดผ่าน Session:", error);
      setErrorMessage(
        `เกิดข้อผิดพลาดในการรันโค้ดผ่าน Session: ${error.message}`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // ฟังก์ชันที่จะถูกเรียกเมื่อเซลล์ถูกรัน
  const handleExecute = (outputs) => {
    console.log("เซลล์ถูกรัน, ผลลัพธ์:", outputs);
    setCellState((prev) => ({
      ...prev,
      outputs: outputs,
      hasBeenExecuted: true,
    }));
  };

  // ฟังก์ชันที่จะถูกเรียกเมื่อเซลล์เปลี่ยนแปลง
  const handleChange = (newSource) => {
    console.log("เซลล์เปลี่ยนแปลง:", newSource);
    setCellState((prev) => ({
      ...prev,
      source: newSource,
    }));
  };

  // ฟังก์ชันพยายามคลิกปุ่มรัน
  const clickRunButton = () => {
    try {
      // ค้นหาปุ่มรันด้วยเซเล็คเตอร์ต่างๆ
      const selectors = [
        ".jp-RunIcon",
        ".jp-ToolbarButton[data-command='runmenu:run']",
        ".jp-Toolbar-item button[title*='Run']",
        ".jp-RunIcon button",
        "button.jp-ToolbarButtonComponent[title='Run']",
        "[data-icon='ui-components:run']",
        ".jp-Toolbar button",
      ];

      let runButton = null;
      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        console.log(`พบปุ่ม ${buttons.length} ปุ่มด้วย selector: ${selector}`);

        if (buttons.length > 0) {
          // ลองคลิกปุ่มแรกที่พบ
          runButton = buttons[0];
          break;
        }
      }

      if (runButton) {
        console.log("พบปุ่มรัน, กำลังคลิก...", runButton);
        runButton.click();
        return true;
      } else {
        console.warn("ไม่พบปุ่มรัน");

        // ลองหาปุ่มทั้งหมดที่อาจเป็นปุ่มรัน
        const allButtons = document.querySelectorAll("button");
        console.log("พบปุ่มทั้งหมด:", allButtons.length);
        if (allButtons.length > 0) {
          console.log(
            "ปุ่มที่พบ:",
            Array.from(allButtons).map((b) => ({
              text: b.textContent,
              title: b.title,
              class: b.className,
            }))
          );
        }

        setErrorMessage("ไม่พบปุ่มรัน (Run button not found)");
        return false;
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการคลิกปุ่มรัน:", error);
      setErrorMessage(`เกิดข้อผิดพลาดในการคลิกปุ่มรัน: ${error.message}`);
      return false;
    }
  };

  // ฟังก์ชันตรวจสอบสถานะเคอร์เนลและถ้าไม่มี kernelId ให้ลองดึงจากล็อก
  const checkKernelStatus = () => {
    try {
      console.log("Checking kernel elements...");

      // แสดงค่า kernelId ที่จัดเก็บไว้
      console.log("Current kernelId in state:", kernelId);
      console.log("Current sessionId in state:", sessionId);

      // ลองค้นหา kernel ID ในล็อก console ของเบราว์เซอร์
      const consoleOutput = document.querySelectorAll(".jp-OutputArea-output");
      console.log("Console output elements:", consoleOutput);

      // ค้นหาองค์ประกอบที่อาจมี kernelId
      const findKernelIdInDOM = () => {
        // ค้นหาข้อความที่มี pattern ของ Kernel ID
        const textNodes = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes("Kernel Details")) {
            textNodes.push({
              node,
              text: node.nodeValue,
            });
          }
        }

        console.log("Found text nodes with Kernel Details:", textNodes);

        if (textNodes.length > 0) {
          // ลองแยก kernel ID จากข้อความ
          for (const item of textNodes) {
            const text = item.text;
            const idMatch = text.match(/id: ['"]?([a-zA-Z0-9-]+)['"]?/);
            const sessionMatch = text.match(
              /sessionId: ['"]?([a-zA-Z0-9-]+)['"]?/
            );

            if (idMatch && idMatch[1]) {
              const foundId = idMatch[1];
              console.log("Found kernel ID in DOM:", foundId);
              if (!kernelId) {
                setKernelId(foundId);
              }
            }

            if (sessionMatch && sessionMatch[1]) {
              const foundSessionId = sessionMatch[1];
              console.log("Found session ID in DOM:", foundSessionId);
              if (!sessionId) {
                setSessionId(foundSessionId);
              }
            }
          }
        }
      };

      findKernelIdInDOM();

      if (kernelId) {
        setErrorMessage(
          `พบ Kernel ID: ${kernelId}${
            sessionId ? `, Session ID: ${sessionId}` : ""
          }`
        );
      } else {
        // ถ้ายังไม่มี kernelId ให้ตรวจสอบอีกครั้ง
        const consoleOutputs = document.querySelectorAll(
          "div.react-console-message"
        );
        let foundKernelId = null;

        consoleOutputs.forEach((output) => {
          const text = output.textContent || "";
          if (text.includes("Kernel Details")) {
            console.log("Found log with Kernel Details:", text);
            const match = text.match(/id: ['"]([^'"]+)['"]/);
            if (match && match[1]) {
              foundKernelId = match[1];
              console.log("Extracted Kernel ID from logs:", foundKernelId);
              setKernelId(foundKernelId);
            }
          }
        });

        if (foundKernelId) {
          setErrorMessage(`พบ Kernel ID จากล็อก: ${foundKernelId}`);
        } else {
          setErrorMessage("ไม่พบข้อมูล Kernel ID");
        }
      }

      // แสดงข้อมูลเพิ่มเติมเกี่ยวกับการเชื่อมต่อ
      console.log(
        "Jupyter config:",
        document.querySelector("body").getAttribute("data-jupyter-config")
      );
    } catch (error) {
      console.error("Error checking kernel:", error);
      setErrorMessage(`เกิดข้อผิดพลาดในการตรวจสอบเคอร์เนล: ${error.message}`);
    }
  };

  // ฟังก์ชันนี้จะลองทุกวิธีที่เป็นไปได้ในการรันโค้ด
  const tryAllRunMethods = async () => {
    setErrorMessage("กำลังลองทุกวิธีในการรันโค้ด...");

    // วิธีที่ 1: คลิกปุ่มรัน
    const clickSuccess = clickRunButton();
    if (clickSuccess) {
      setErrorMessage("คลิกปุ่มรันสำเร็จ");
      return;
    }

    // วิธีที่ 2: ใช้ Kernel Execute API
    if (kernelId) {
      setErrorMessage("กำลังลองใช้ Kernel Execute API...");
      try {
        // ลองเรียก API หลายรูปแบบ
        const apis = [
          `/api/jupyter/api/kernels/{id}/execute`,
          `/api/jupyter/api/kernels/${kernelId}/execute`,
          `/jupyter/kernels/${kernelId}/execute`,
        ];

        for (const apiUrl of apis) {
          try {
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: cellState.source,
                silent: false,
                store_history: true,
                user_expressions: {},
                allow_stdin: false,
              }),
            });

            if (response.ok) {
              setErrorMessage(`API ${apiUrl} ทำงานสำเร็จ!`);
              return;
            } else {
              console.log(`API ${apiUrl} ไม่สำเร็จ: ${response.status}`);
            }
          } catch (err) {
            console.error(`ข้อผิดพลาดเมื่อเรียก ${apiUrl}:`, err);
          }
        }

        setErrorMessage("ไม่สามารถรันโค้ดผ่าน Kernel API ได้");
      } catch (error) {
        setErrorMessage(`เกิดข้อผิดพลาดในการรันผ่าน API: ${error.message}`);
      }
    }

    // วิธีที่ 3: ใช้ Session API
    if (sessionId) {
      setErrorMessage("กำลังลองใช้ Session API...");
      try {
        executeViaSession();
      } catch (error) {
        setErrorMessage(
          `เกิดข้อผิดพลาดในการรันผ่าน Session API: ${error.message}`
        );
      }
    }

    setErrorMessage("ลองทุกวิธีแล้วไม่สำเร็จ");
  };

  if (!isMounted) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div>
      <h2>Jupyter Cell</h2>

      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={resetCell}
          style={{
            padding: "8px 12px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          รีเซ็ตเซลล์
        </button>
        <button
          onClick={clickRunButton}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          คลิกปุ่มรัน
        </button>
        <button
          onClick={executeCodeDirectly}
          disabled={isExecuting || !kernelId}
          style={{
            padding: "8px 12px",
            backgroundColor: "#6f42c1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isExecuting || !kernelId ? "not-allowed" : "pointer",
            opacity: isExecuting || !kernelId ? 0.7 : 1,
          }}
        >
          {isExecuting ? "กำลังรัน..." : "รันโค้ดผ่าน API"}
        </button>
        <button
          onClick={checkKernelStatus}
          style={{
            padding: "8px 12px",
            backgroundColor: "#FFC107",
            color: "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ตรวจสอบสถานะเคอร์เนล
        </button>
        <button
          onClick={tryAllRunMethods}
          style={{
            padding: "8px 12px",
            backgroundColor: "#fd7e14",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ลองทุกวิธี
        </button>
      </div>

      {kernelId && (
        <div
          style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          เชื่อมต่อกับ Kernel ID: {kernelId}
          {sessionId && <div>Session ID: {sessionId}</div>}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        ref={cellRef}
        style={{
          border: "1px solid #ccc",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "4px",
        }}
      >
        <JupyterProvider
          jupyterServerUrl="/api/jupyter"
          jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
          startDefaultKernel
          useCDN={false}
          colormode="light"
          theme={{
            colorMode: "light",
            colors: {
              primary: "#F37726",
              background: "#ffffff",
              text: "#000000",
              border: "#e0e0e0",
              sidebar: "#f5f5f5",
              toolbar: "#f8f8f8",
            },
          }}
          defaultCell={{ editable: true, read_only: false }}
        >
          <JupyterCell
            source={cellState.source}
            outputs={cellState.outputs}
            onChange={handleChange}
            onExecute={handleExecute}
            editable={true}
            read_only={false}
          />
        </JupyterProvider>
      </div>

      <div
        style={{
          backgroundColor: "#f8f8f8",
          padding: "16px",
          borderRadius: "4px",
          marginBottom: "16px",
        }}
      >
        <h3>สถานะ:</h3>
        <ul>
          <li>เซลล์ถูกรันแล้ว: {cellState.hasBeenExecuted ? "ใช่" : "ไม่"}</li>
          <li>
            จำนวนผลลัพธ์: {cellState.outputs ? cellState.outputs.length : 0}
          </li>
          <li>
            Source code ปัจจุบัน: <code>{cellState.source}</code>
          </li>
        </ul>
      </div>

      <div
        style={{
          marginTop: "20px",
          backgroundColor: "#e9f5ff",
          padding: "16px",
          borderRadius: "4px",
          border: "1px solid #c2e0ff",
        }}
      >
        <h3>คำแนะนำและการแก้ไขปัญหา:</h3>
        <ol>
          <li>
            ได้แก้ไข API path แล้ว โดยลบ "/api" ออกจาก URL เป็น
            "/api/jupyter/kernels/..."
          </li>
          <li>
            กดปุ่ม "ลองทุกวิธี" เพื่อให้ระบบลองทุกวิธีที่เป็นไปได้ในการรันโค้ด
          </li>
          <li>
            กดปุ่ม "ตรวจสอบสถานะเคอร์เนล" เพื่อดูสถานะการเชื่อมต่อกับเคอร์เนล
          </li>
          <li>
            หากปุ่มรันไม่ทำงาน ให้ลองกดปุ่ม "รันโค้ดผ่าน API"
            ซึ่งจะรันโค้ดโดยตรงผ่าน Jupyter API
          </li>
          <li>ตรวจสอบคอนโซลในเบราว์เซอร์เพื่อดูข้อผิดพลาดที่เกิดขึ้น</li>
        </ol>
      </div>
    </div>
  );
}

// src/shims/react-dom.js
import * as ReactDOMClient from "react-dom/client";
import * as ReactDOMOriginal from "react-dom";

// เพิ่ม unmountComponentAtNode ที่หายไปใน React 18
export const unmountComponentAtNode = (container) => {
  if (container._reactRootContainer) {
    ReactDOMClient.createRoot(container).unmount();
    return true;
  }
  return false;
};

// Export สำหรับ react-dom/client
export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;

// Export ทุกอย่างจาก ReactDOM พร้อมกับฟังก์ชันที่เพิ่มเข้ามา
const ReactDOM = {
  ...ReactDOMOriginal,
  unmountComponentAtNode,
  // เพิ่ม client functionality
  createRoot,
  hydrateRoot,
};

// Export ทั้งแบบ named exports และ default export
export * from "react-dom";
export default ReactDOM;

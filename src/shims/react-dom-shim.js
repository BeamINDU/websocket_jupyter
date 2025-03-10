// react-dom-shim.js
import * as ReactDOMClient from "react-dom/client";
import * as ReactDOMOriginal from "react-dom";

// เพิ่มฟังก์ชัน unmountComponentAtNode ที่ขาดหายไปใน React 18
export const unmountComponentAtNode = (container) => {
  if (container._reactRootContainer) {
    ReactDOMClient.createRoot(container).unmount();
    return true;
  }
  return false;
};

// คงสภาพ default export ของ ReactDOM
const ReactDOM = {
  ...ReactDOMOriginal,
  unmountComponentAtNode,
};

// คงสภาพการ export แบบ named และ default
export * from "react-dom";
export default ReactDOM;

"use client";

import React, { useEffect, useRef } from "react";

export default function SupersetEmbed({ url, height = "800px" }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.onload = () => {
      try {
        // เข้าถึง document ภายใน iframe
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument || iframeWindow.document;

        // สร้าง style element
        const style = iframeDocument.createElement("style");

        // ใช้เซเลกเตอร์ที่เฉพาะเจาะจงมากขึ้น
        style.innerHTML = `
          /* ซ่อนโลโก้ */
          .navbar-brand, 
          .navbar-brand img, 
          .navbar-brand svg,
          a.navbar-brand,
          .navbar a.navbar-brand,
          header .navbar-brand,
          .header .navbar-brand,
          img.navbar-brand,
          .brand-logo,
          .logo,
          [class*="brand"],
          [class*="logo"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          /* ซ่อนแถบนำทางด้านบนทั้งหมด */
          .navbar,
          header,
          .header,
          nav,
          .nav-bar,
          .top-navigation,
          .ant-layout-header {
            display: none !important;
          }
          
          /* ปรับ padding ของ content */
          body {
            padding-top: 0 !important;
          }
          
          .dashboard-content,
          .main-content,
          .content,
          .ant-layout-content,
          main {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
        `;

        // เพิ่ม style ลงใน head
        iframeDocument.head.appendChild(style);

        console.log("CSS has been injected into iframe");

        // เพิ่มโค้ด JavaScript เพื่อลบโลโก้
        const script = iframeDocument.createElement("script");
        script.innerHTML = `
          // ลบองค์ประกอบโลโก้
          function removeElements() {
            const elements = [
              document.querySelectorAll('.navbar-brand'),
              document.querySelectorAll('.navbar'),
              document.querySelectorAll('header'),
              document.querySelectorAll('.header'),
              document.querySelectorAll('[class*="brand"]'),
              document.querySelectorAll('[class*="logo"]')
            ].flat();
            
            elements.forEach(el => {
              if (el) el.style.display = 'none';
            });
            
            console.log('Elements hidden via JavaScript');
          }
          
          // เรียกฟังก์ชันทันที
          removeElements();
          
          // เรียกอีกครั้งหลังจากโหลดหน้าเสร็จ
          window.addEventListener('load', removeElements);
          
          // เรียกทุกๆ 1 วินาที เพื่อจัดการกับองค์ประกอบที่อาจโหลดช้า
          setTimeout(removeElements, 1000);
          setTimeout(removeElements, 2000);
        `;

        // เพิ่ม script ลงใน body
        iframeDocument.body.appendChild(script);
      } catch (error) {
        console.error("Error manipulating iframe content:", error);
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height }}>
      <iframe
        ref={iframeRef}
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Superset Dashboard"
        style={{ border: "none", borderRadius: "4px" }}
      />
    </div>
  );
}

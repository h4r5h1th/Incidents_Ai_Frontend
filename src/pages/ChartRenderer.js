import { useEffect, useRef } from "react";

function ChartRenderer({ html }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Ensure iframe is same-origin by not setting src and using sandbox
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    if (!doc) {
      console.warn("Iframe document not accessible.");
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 12px;
              background-color: transparent;
              font-family: Roboto, sans-serif;
              color: white;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    doc.close();
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="chart"
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: "100%",
        minHeight: "300px",
        border: "none",
        background: "transparent",
      }}
    />
  );
}

export default ChartRenderer;

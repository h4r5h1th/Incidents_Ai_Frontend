// components/HtmlWithScripts.js
import React, { useEffect, useRef } from "react";

const HtmlWithScripts = ({ html }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = html;

      const scripts = containerRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });
    }
  }, [html]);

  return <div ref={containerRef} />;
};

export default HtmlWithScripts;

import { useEffect } from "react";

function setMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector);
  const created = !element;
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    document.head.appendChild(element);
  }
  const previousContent = element.getAttribute("content");
  element.setAttribute("content", content);
  return { created, element, previousContent };
}

export default function usePageMeta({ title, description }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const metas = [
      setMeta('meta[name="description"]', { name: "description" }, description),
      setMeta('meta[property="og:title"]', { property: "og:title" }, title),
      setMeta('meta[property="og:description"]', { property: "og:description" }, description),
    ];

    return () => {
      document.title = previousTitle;
      metas.forEach(({ created, element, previousContent }) => {
        if (created) element.remove();
        else if (previousContent === null) element.removeAttribute("content");
        else element.setAttribute("content", previousContent);
      });
    };
  }, [description, title]);
}

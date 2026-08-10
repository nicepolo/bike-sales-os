import { createLineMessageUrl } from "../../config/beBike";

export default function LineCta({ children, message, className = "be-bike-button be-bike-button-primary" }) {
  return (
    <a className={className} href={createLineMessageUrl(message)} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

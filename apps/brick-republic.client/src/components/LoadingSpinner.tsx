import { Spinner } from "react-bootstrap";

export function LoadingSpinner({
  className = "d-block mx-auto mt-5",
  size,
}: {
  className?: string;
  size?: "sm";
}) {
  return <Spinner animation="border" className={className} size={size} />;
}

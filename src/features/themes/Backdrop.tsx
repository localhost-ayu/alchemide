import "./themes.css";
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__layer" />
    </div>
  );
}

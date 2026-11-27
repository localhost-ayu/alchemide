import { useT } from "../../lib/i18n";

export function FlaskSpinner() {
  const t = useT();
  return (
    <svg className="flask-spinner" viewBox="0 0 16 16" role="img" aria-label={t("common.working")}>
      <path
        className="flask-spinner__glass"
        d="M6 1.5h4M6.5 1.5v4.2L2.8 12.6A1.3 1.3 0 0 0 4 14.5h8a1.3 1.3 0 0 0 1.2-1.9L9.5 5.7V1.5"
      />
      <path
        className="flask-spinner__liquid"
        d="M4.4 10h7.2l1.2 2.4a.6.6 0 0 1-.5.9H3.7a.6.6 0 0 1-.5-.9z"
      />
      <circle className="flask-spinner__bubble" cx="6.8" cy="10.5" r="0.8" />
      <circle className="flask-spinner__bubble" cx="9.2" cy="11" r="0.6" />
      <circle className="flask-spinner__bubble" cx="8" cy="11.5" r="0.5" />
    </svg>
  );
}

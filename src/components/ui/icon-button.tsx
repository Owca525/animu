import { FC } from "react";

interface buttonprops extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  value?: string;
}

const button: FC<buttonprops> = ({ value }) => {
  return (
    <input
      className="material-icons-outlined icon-button"
      value={value}
      type="button"
      style={{
        backgroundColor: "var(--primary-200)",
        border: "none",
        width: "40px",
        height: "40px",
        borderColor: "var(--primary-800)",
        color: "var(--primary-800)",
        borderStyle: "solid",
        borderWidth: "1px",
        borderRadius: "4px",
        cursor: "pointer"
      }}
    />
  );
};

export default button;

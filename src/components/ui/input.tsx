import { FC } from "react";
import "../../css/ui/input.css";

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const input: FC<inputprops> = ({ placeholder }) => {
  return (
    <input
      placeholder={placeholder}
      type="input"
      style={{
        WebkitAppearance: "none",
        border: "none",
        outline: "none",
        padding: "12px",
        maxWidth: "400px",
        width: "100%",
        borderRadius: "4px",
        backgroundColor: "var(--primary-300)",
        boxShadow: "1px 1px 20px rgb(0, 0, 0, 0.2)",
      }}
    />
  );
};

export default input;

import { FC } from "react";
import "../../css/ui/button.css";

interface buttonprops extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  value?: string;
  title?: string;
  className?: string;
  type?: "icon" | "icon-text"
  onClick?: () => void;
}

const button: FC<buttonprops> = ({ value = "", type = "none", title, className, onClick }) => {
  return (
    <button title={title} className={`button-${type} ${className || ''} backlight`} dangerouslySetInnerHTML={{__html: value}} onClick={onClick} ></button>
  );
};

export default button;

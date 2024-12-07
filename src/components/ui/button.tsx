import { FC } from "react";
import "../../css/ui/button.css";
// import { ContainerProps } from "../../utils/interface"

interface buttonprops extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  value?: string;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const button: FC<buttonprops> = ({ value = "", title, className, onClick }) => {
  return (
    <button title={title} className={className} dangerouslySetInnerHTML={{__html: value}} onClick={onClick} ></button>
  );
};

export default button;

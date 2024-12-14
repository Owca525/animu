import { FC } from "react";
import "../../css/ui/checkbox.css";

interface checkboxProps extends React.HtmlHTMLAttributes<HTMLInputElement> {
    title: string
}

const Checkbox: FC<checkboxProps> = ({ title }) => {
  return (
    <div className="checkbox-container">
        {title}<input type="checkbox" className="checkbox" />
    </div>
  );
};

export default Checkbox;

import { FC } from "react";
import "../../css/ui/checkbox.css";

interface checkboxProps extends React.HtmlHTMLAttributes<HTMLInputElement> {
    title: string
    classContainer?: string
    classCheckbox?: string
}

const Checkbox: FC<checkboxProps> = ({ title, classContainer, classCheckbox}) => {
  return (
    <div className={classContainer + " checkbox-container"}>
        {title}<input type="checkbox" className={classCheckbox + " checkbox"} />
    </div>
  );
};

export default Checkbox;

import { FC } from "react";
import "../../css/ui/checkbox.css";

interface checkboxProps extends React.HtmlHTMLAttributes<HTMLInputElement> {
    title: string
    classContainer?: string
    classCheckbox?: string
    checked?: boolean;
}

const Checkbox: FC<checkboxProps> = ({ title, classContainer, classCheckbox, checked = false}) => {
  return (
    <div className={classContainer + " checkbox-container"}>
        {title}<input type="checkbox" className={classCheckbox + " checkbox"} checked={checked} />
    </div>
  );
};

export default Checkbox;

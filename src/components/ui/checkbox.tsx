import { FC } from "react";
import "../../css/ui/checkbox.css";

interface checkboxProps extends React.HtmlHTMLAttributes<HTMLInputElement> {
    title: string
    classContainer?: string
    classCheckbox?: string
    checked?: boolean;
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    ref?: any;
}

const Checkbox: FC<checkboxProps> = ({ title, classContainer, classCheckbox, checked = false, onClick, ref}) => {

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className={classContainer + " checkbox-container"}>
        {title}<input type="checkbox" className={classCheckbox + " checkbox"} checked={checked} onClick={handleClick} ref={ref} />
    </div>
  );
};

export default Checkbox;

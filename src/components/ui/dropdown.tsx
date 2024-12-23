import React, { useState } from "react";
import "../../css/ui/dropdown.css"

interface DropdownOption {
  label: string;
  value: string;
  onClick?: () => void;
}

interface DropdownProps {
  options: DropdownOption[];
  placeholder: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, placeholder = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: DropdownOption) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (option.onClick) {
      option.onClick();
    }
  };

  return (
    <div className="dropdown">
      <div
        className="dropdown-button"
        onClick={toggleDropdown}>
        {selectedOption ? selectedOption.label : placeholder}
      </div>
      {isOpen && (
        <ul className="dropdown-menu" onMouseLeave={() => setIsOpen(false)}>
          {options.map((option) => (
            <li key={option.value} className="dropdown-item" onClick={() => handleOptionClick(option)}>
                {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
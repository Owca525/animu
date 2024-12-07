import Input from "../ui/input";
import "../../css/elements/headers.css";
import React from "react";

interface TextInputProps {
  onInputChange?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const header: React.FC<TextInputProps> = ({ onInputChange }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (onInputChange) {
      onInputChange(event);
    }
  };

  return (
    <div className="header">
      <Input placeholder="Search Anime..." onKeyDown={handleKeyDown} />
    </div>
  );
}

export default header;
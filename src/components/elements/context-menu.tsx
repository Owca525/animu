import React, { useState, useRef, useEffect } from "react";
import "../../css/elements/context-menu.css";

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface ContextMenuProps {
  items: MenuItem[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setIsVisible(true);
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return isVisible ? (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="context-menu-item"
          onClick={() => {
            item.onClick();
            setIsVisible(false);
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  ) : null;
};

export default ContextMenu;

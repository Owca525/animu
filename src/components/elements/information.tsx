import { useEffect, useRef } from "react";
import "../../css/elements/information.css";

interface Props {
  title: string;
  showPopup: boolean;
  toggle: () => void;
}

export const Information: React.FC<Props> = ({ title, showPopup, toggle }) => {
  const modalRef: any = useRef();

  const handleClickOutside = (event: any) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      toggle();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        toggle();
      }
    };

    if (showPopup) {
      document.addEventListener("keydown", handleKeyDown);
    } else document.removeEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPopup]);

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showPopup]);

  return (
    <div
      className="modal-backdrop"
      style={{ visibility: showPopup ? "visible" : "hidden" }}
    >
      <div className="modal-content" ref={modalRef}>
        {title}
      </div>
    </div>
  );
};

import { FC } from "react";
// import { ContainerProps } from "../../utils/interface"

interface buttonprops extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  value?: string;
  title?: string;
  className?: string;
}

const button: FC<buttonprops> = ({ value, title, className }) => {
  return (
    <input
      title={title}
      className={className + " material-symbols-outlined icon-button"}
      value={value}
      type="button"
      style={{
        WebkitAppearance: "none",
      }}
    />
  );
};

export default button;

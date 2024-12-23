import { ChangeEvent, FC } from "react";
import HelpIcon from "./helpIcon";

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  title: string,
  placeholder: string,
  value: string | number,
  type: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  helpDescription?: string
}

const input: FC<inputprops> = ({ title, placeholder, value, onChange, type, helpDescription }) => {
  function checkContain() {
    if (value.toString().endsWith(type) == false) {
      value = value.toString().replace(type, "")
    }

    if (value.toString().includes(type)) {
      return value
    }
    return value + type
  }

  return (
    <div className="same-space">
      <div className="text-space">{title}
        {helpDescription && (
          <HelpIcon description={helpDescription} />
        )}
      </div> 
      <input type="text" className="number" placeholder={placeholder} value={checkContain()} onChange={onChange} />
    </div>
  );
};

export default input;

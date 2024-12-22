import { ChangeEvent, FC } from "react";

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
    title: string,
    placeholder: string,
    value: string | number,
    type: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

const input: FC<inputprops> = ({ title, placeholder, value, onChange, type }) => {
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
        {title} <input type="text" className="number"  placeholder={placeholder} value={checkContain()} onChange={onChange} />
    </div>
  );
};

export default input;

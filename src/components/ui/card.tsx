import { FC } from "react";

interface cardprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const card: FC<cardprops> = ({ }) => {
  return (
    <div className="card">
        <div className="card-img">Test</div>
        <div className="card-text">Test</div>
    </div>
  );
};

export default card;

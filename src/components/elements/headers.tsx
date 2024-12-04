import Input from "../ui/input";
import "../../css/elements/headers.css";

export default function header() {
  return (
    <div className="header">
      <Input placeholder="Search Anime..." />
    </div>
  );
}

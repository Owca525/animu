import Button from "../ui/icon-button"

export default function sidebar() {
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value="arrow_forward" />
        <div className="border"></div>
        <Button value="schedule" />
        <Button value="history" />
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value="extension" />
        <Button value="settings" />
      </div>
    </div>
  );
};

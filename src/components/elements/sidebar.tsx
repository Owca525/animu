import Button from "../ui/icon-button"

export default function sidebar() {
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value="arrow_forward" />
        <div className="border"></div>
        <Button value="schedule" title="Recent Anime" className="active"/>
        <Button value="history" title="History" />
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value="extension" title="Extension" />
        <Button value="settings" title="Settings" />
      </div>
    </div>
  );
};

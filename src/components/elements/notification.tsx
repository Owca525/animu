import React, { useEffect, useState } from "react";
import "../../css/elements/notifiaction.css";
import { NotificationProps } from "../../utils/interface";

const Notification: React.FC<NotificationProps> = ({ data }) => {
  const [visibleNotifications, setVisibleNotifications] = useState<boolean[]>(
    new Array(data.length).fill(true)
  );

  useEffect(() => {
    const timers = data.map((_, index) => {
      return setTimeout(() => {
        setVisibleNotifications((prev) => {
          const newVisibleNotifications = [...prev];
          newVisibleNotifications[index] = false;
          return newVisibleNotifications;
        });
      }, 10000);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [data.length]);

  const handleNotificationClick = (index: number, onClick?: () => void) => {
    setVisibleNotifications((prev) => {
      const newVisibleNotifications = [...prev];
      newVisibleNotifications[index] = false;
      return newVisibleNotifications;
    });

    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="notification-container">
      {data.map((notification, index) =>
        visibleNotifications[index] ? (
          <div
            key={index}
            className="notification"
            onClick={() => handleNotificationClick(index, notification.onClick)}
          >
            <div className="notification-title">{notification.title}</div>
            <div className="notification-info">{notification.information}</div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default Notification;

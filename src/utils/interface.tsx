export interface ContainerProps {
  title: string;
  data?: { id: string; title: string; img: string }[];
  className?: string;
}

export interface InformationProps {
  id_anime: string;
  showPopup: boolean;
  toggle: () => void;
}

export interface InformationData {
  id: string;
  title: string;
  description: string;
  img: string;
  episodes: Array<string>;
}

interface ListItem {
  value: string;
  class?: string;
  title: string;
  onClick?: () => Promise<void>;
}

export interface SidebarListProps {
  top: ListItem[];
  bottom: ListItem[]
}

export interface SidebarProps {
  top: ListItem[];
  bottom: ListItem[]
}

export interface NotificationProps {
  data: { title: string; information: string; onClick?: () => void }[];
}


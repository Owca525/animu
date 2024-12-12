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

export interface SidebarProps {
  change_content: (data: ContainerProps) => void;
  // data: { top: { value: string, class: string, title?: string, onClick?: () => void }[], bottom: { value: string, class: string, title?: string, onClick?: () => void }[] }
}

export interface NotificationProps {
  data: { title: string; information: string; onClick?: () => void }[];
}
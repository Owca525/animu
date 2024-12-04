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
  onButtonClick: (data: ContainerProps) => void;
}

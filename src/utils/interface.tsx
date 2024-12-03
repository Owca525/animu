export interface ContainerProps {
  title: string;
  data?: { id: string, title: string; img: string }[];
  className?: string;
}

export interface SidebarProps {
    onButtonClick: (data: ContainerProps) => void;
}
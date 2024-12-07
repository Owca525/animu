import Sidebar from "../components/elements/sidebar";
import Content from "../components/elements/main-content";
import Header from "../components/elements/headers";
import "../css/pages/home.css";

import { ContainerProps } from "../utils/interface";
import { get_recent } from "../utils/backend";
import { useEffect, useState } from "react";

function home() {
  const [data, setData] = useState<ContainerProps>({ title: "", data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const recentData = await get_recent();
      setData({
        title: "Recent Anime",
        data: recentData,
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const change_content = (newData: ContainerProps) => {
    console.log(newData)
    setData(newData)
  };

  if (loading) {
    return (
      <main className="container">
        <Sidebar change_content={change_content} />
        <Header/>
      </main>
    );
  }

  return (
    <main className="container">
      <Sidebar change_content={change_content} />
      <Header/>
      <Content title={data.title} data={data.data} />
    </main>
  );
}

export default home;

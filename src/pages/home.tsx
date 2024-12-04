import Sidebar from "../components/elements/sidebar";
import Content from "../components/elements/main-content";
import { ContainerProps } from "../utils/interface";
import { get_recent } from "../utils/backend";
import { useEffect, useState } from "react";
import Header from "../components/elements/headers";

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

  const handleButtonClick = (newData: ContainerProps) => {
    console.log(newData)
    setData(newData);
  };

  if (loading) {
    return (
      <main className="container">
        <Sidebar onButtonClick={handleButtonClick} />
        <Header/>
      </main>
    );
  }

  return (
    <main className="container">
      <Sidebar onButtonClick={handleButtonClick} />
      <Header/>
      <Content title={data.title} data={data.data} />
    </main>
  );
}

export default home;

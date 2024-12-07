import Sidebar from "../components/elements/sidebar";
import Content from "../components/elements/card-content";
import Header from "../components/elements/headers";
import "../css/pages/home.css";

import { ContainerProps } from "../utils/interface";
import { get_recent, get_search } from "../utils/backend";
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
    setData(newData)
  };

  const handleInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      var search = event.currentTarget.value;
      const results = async () => {
        const data = await get_search(search);
        change_content({ title: `Searching: ${search}`, data: data});
      };
      results();
    }
  };

  if (loading) {
    return (
      <main className="container">
        <Sidebar change_content={change_content} />
        <Header onInputChange={handleInputChange}/>
      </main>
    );
  }

  return (
    <main className="container">
      <Sidebar change_content={change_content} />
      <Header onInputChange={handleInputChange}/>
      <Content title={data.title} data={data.data} />
    </main>
  );
}

export default home;

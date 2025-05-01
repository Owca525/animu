import { toast } from "react-toastify";

const test1 = () => {
    toast.info("PLugins test1 loaded")
};

export const information = () => {
    return {
        version: "0.1",
        name: "Test1",
    }
};

export default test1;
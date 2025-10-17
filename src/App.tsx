import "./App.css";
import Table from "./UITable.tsx";
import { useState } from "react";

const header = ["A", "B", "C"];

const data = [
  ["a1", "b1", "b1"],
  ["a2", "b2", "b2"],
  ["a3", "b3", "b3"],
];

function App() {
  const [head, setHead] = useState<string[]>(header);
  const [rows, setRows] = useState<string[][]>(data);

  const onPointerDown = () => {
    setHead(["AA", "BB", "CC"]);
    setRows([
      ["11", "12", "13"],
      ["21", "22", "23"],
      ["31", "32", "33"],
    ]);
    console.log("hello");
  };

  return (
    <div onPointerDown={onPointerDown}>
      <Table header={head} data={rows} />
    </div>
  );
}

export default App;

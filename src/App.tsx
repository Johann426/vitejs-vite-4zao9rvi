import "./App.css";
import Table from "./UITable.tsx";

function App() {
  const header = ["A", "B", "C"];

  const data = [
    ["a1", "b1", "b1"],
    ["a2", "b2", "b2"],
    ["a3", "b3", "b3"],
  ];

  return (
    <>
      <Table header={header} data={data} />
    </>
  );
}

export default App;

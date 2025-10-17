import { useState, useEffect } from "react";

interface Head {
  val: string;
  onPointerDown: () => void;
}

function Th({ val, onPointerDown }: Head) {
  return <th onPointerDown={onPointerDown}>{val}</th>;
}

interface Cell {
  row: number;
  col: number;
  val: string;
  bool: boolean;
  className: string;
  onBlur: () => void;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  onDoubleClick: () => void;
  onChange: (row: number, col: number, val: string) => void;
  onKeyDown: (
    i: number,
    j: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
}

function Td({
  row: i,
  col: j,
  val,
  bool,
  className,
  onBlur,
  onPointerDown,
  onPointerEnter,
  onDoubleClick,
  onChange,
  onKeyDown,
}: Cell) {
  return (
    <td
      className={className}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onDoubleClick={onDoubleClick}
      // onClick={(e) => e.currentTarget.focus()}
    >
      {bool ? (
        <input // render input element inside <td>
          autoFocus
          onFocus={(e) => e.target.select()}
          value={val}
          onBlur={onBlur}
          onChange={(e) => onChange(i, j, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, j, e)}
        />
      ) : (
        val
      )}
    </td>
  );
}

interface TableData {
  header: string[];
  data: string[][];
}

export default function Table({ header, data }: TableData) {
  type CellCoords = { row: number; col: number } | null;

  const [coord, setCoord] = useState<CellCoords>(null); // Coordinates of the cell being edited

  const [lead, setLead] = useState<CellCoords>(null); // Coordinates of drag start

  const [tail, setTail] = useState<CellCoords>(null); // Coordinates of drag end

  const [drag, setDrag] = useState<boolean>(false);

  const [head, setHead] = useState<string[]>(header);

  const [rows, setRows] = useState<string[][]>(data);

  type CellRange = { imin: number; imax: number; jmin: number; jmax: number };

  const getRange = (lead: CellCoords, tail: CellCoords): CellRange | null => {
    if (!lead || !tail) return null;
    return {
      imin: Math.min(lead.row, tail.row),
      imax: Math.max(lead.row, tail.row),
      jmin: Math.min(lead.col, tail.col),
      jmax: Math.max(lead.col, tail.col),
    };
  };

  const onPointerDown = (i: number, j: number): void => {
    setDrag(true);
    setLead({ row: i, col: j });
    setTail({ row: i, col: j });
  };

  const onPointerEnter = (i: number, j: number): void => {
    if (!drag || !lead) return;
    setTail({ row: i, col: j });
  };

  const onPointerUp = (): void => {
    setDrag(false);
  };

  const onDoubleClick = (i: number, j: number): void => {
    setCoord({ row: i, col: j });
  };

  const onChange = (i: number, j: number, val: string): void => {
    const dat = rows.map((row) => [...row]);
    dat[i][j] = val;
    setRows(dat);
  };

  const isCellInRange = (i: number, j: number): boolean => {
    const range = getRange(lead, tail);
    if (!range) return false;
    const { imin, imax, jmin, jmax } = range;
    return i >= imin && i <= imax && j >= jmin && j <= jmax;
  };

  const onCopy = (): void => {
    const range = getRange(lead, tail);
    if (!range) return;
    const { imin, imax, jmin, jmax } = range;
    const copied: string[] = [];
    for (let i = imin; i <= imax; i++) {
      const row: string[] = [];
      for (let j = jmin; j <= jmax; j++) {
        row.push(rows[i][j]);
      }
      copied.push(row.join("\t"));
    }
    const clipboardText = copied.join("\n");
    navigator.clipboard.writeText(clipboardText).then(() => {
      console.log("Copied to clipboard:");
      console.log(clipboardText);
    });
  };

  const onPaste = async () => {
    if (!lead) return;

    try {
      const txt = await navigator.clipboard.readText();
      const arr = txt.split("\n").map((row) => row.split("\t"));
      const last = arr[arr.length - 1];
      if (last.length === 1 && last[0] === "") {
        arr.pop(); // remove if the last element is empty
      }

      const dat = [...rows];

      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
          const row = lead.row + i;
          const col = lead.col + j;
          if (row < rows.length && col < rows[0].length) {
            dat[row][col] = arr[i][j];
          }
        }
      }

      setRows(dat);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      e.preventDefault();
      onCopy();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();
      onPaste();
    }
    if (e.key === "Escape") {
      setLead(null);
    }
    if (e.key === "Delete" && !coord) {
      e.preventDefault();
      const range = getRange(lead, tail);
      if (!range) return;

      const { imin, imax, jmin, jmax } = range;
      const dat = [...rows];

      for (let i = imin; i <= imax; i++) {
        for (let j = jmin; j <= jmax; j++) {
          dat[i][j] = "";
        }
      }
      setRows(dat);
    }
  };

  const onKeyDownCell = (
    i: number,
    j: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const deSelect = () => {
      setLead(null);
      setTail(null);
      e.preventDefault();
    };

    switch (e.key) {
      case "Enter":
      case "ArrowDown":
        deSelect();
        setCoord({ row: i + 1, col: j });
        break;
      case "ArrowUp":
        deSelect();
        setCoord({ row: i - 1, col: j });
        break;
      case "ArrowLeft":
        deSelect();
        setCoord({ row: i, col: j - 1 });
        break;
      case "ArrowRight":
        deSelect();
        setCoord({ row: i, col: j + 1 });
        break;
    }
  };

  const onPointerDownHeader = (j: number): void => {
    setLead({ row: 0, col: j });
    setTail({ row: data.length, col: j });
    console.log(j);
  };

  return (
    <table tabIndex={0} onPointerUp={onPointerUp} onKeyDown={onKeyDown}>
      <thead>
        <tr>
          {head.map((v, j) => (
            <Th
              key={`col${j}`}
              val={v}
              onPointerDown={() => onPointerDownHeader(j)}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((arr, i) => (
          <tr key={i}>
            {arr.map((v, j) => (
              <Td
                key={j}
                row={i}
                col={j}
                val={v}
                bool={coord?.row == i && coord?.col == j}
                className={isCellInRange(i, j) ? "selected" : ""}
                onBlur={() => setCoord(null)}
                onPointerDown={() => onPointerDown(i, j)}
                onPointerEnter={() => onPointerEnter(i, j)}
                onDoubleClick={() => onDoubleClick(i, j)}
                onChange={onChange}
                onKeyDown={onKeyDownCell}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { useState, useEffect, useCallback } from "react";

type Cell = {
  i: number;
  j: number;
  val: string;
  bool: boolean;
  className: string;
  onDoubleClick: () => void;
  onChange: (row: number, j: number, val: string) => void;
  onBlur: () => void;
  onKeyDown: (
    i: number,
    j: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  onPointerDown: () => void;
  onPointerEnter: () => void;
};

function Td({
  i,
  j,
  val,
  bool,
  className,
  onDoubleClick,
  onChange,
  onBlur,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
}: Cell) {
  return (
    <td
      className={className}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onClick={(e) => e.currentTarget.focus()}
    >
      {bool ? ( // render input element inside <td> if
        <input
          autoFocus
          onFocus={(e) => e.target.select()}
          value={val}
          onChange={(e) => onChange(i, j, e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => onKeyDown(i, j, e)}
        />
      ) : (
        val
      )}
    </td>
  );
}

export default function Table() {
  type CellCoords = { row: number; col: number } | null;

  const [coord, setCoord] = useState<CellCoords>(null); // Coordinates of the cell being edited

  const [lead, setLead] = useState<CellCoords>(null); // Coordinates of drag start

  const [tail, setTail] = useState<CellCoords>(null); // Coordinates of drag end

  const [drag, setDrag] = useState<boolean>(false);

  const [data, setData] = useState<string[][]>([
    ["A1", "B1", "C1"],
    ["A2", "B2", "C2"],
    ["A3", "B3", "C3"],
  ]);

  type CellRange = { imin: number; imax: number; jmin: number; jmax: number };

  const getRange = useCallback(
    (lead: CellCoords, tail: CellCoords): CellRange | null => {
      if (!lead || !tail) return null;
      return {
        imin: Math.min(lead.row, tail.row),
        imax: Math.max(lead.row, tail.row),
        jmin: Math.min(lead.col, tail.col),
        jmax: Math.max(lead.col, tail.col),
      };
    },
    []
  );

  const onDoubleClick = (i: number, j: number): void => {
    setCoord({ row: i, col: j });
  };

  const onKeyDown = (
    i: number,
    j: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    switch (e.key) {
      case "Enter":
      case "ArrowDown":
        setCoord({ row: i + 1, col: j });
        e.preventDefault();
        break;
      case "ArrowUp":
        setCoord({ row: i - 1, col: j });
        e.preventDefault();
        break;
      case "ArrowLeft":
        setCoord({ row: i, col: j - 1 });
        e.preventDefault();
        break;
      case "ArrowRight":
        setCoord({ row: i, col: j + 1 });
        e.preventDefault();
        break;
    }
  };

  const onChange = (i: number, j: number, val: string): void => {
    const rows = data.map((row) => [...row]);
    rows[i][j] = val;
    setData(rows);
  };

  useEffect(() => {
    const onCopy = (): void => {
      const range = getRange(lead, tail);
      if (!range) return;
      const { imin, imax, jmin, jmax } = range;
      const copied: string[] = [];
      for (let i = imin; i <= imax; i++) {
        const row: string[] = [];
        for (let j = jmin; j <= jmax; j++) {
          row.push(data[i][j]);
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

        const dat = [...data];

        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr[i].length; j++) {
            const row = lead.row + i;
            const col = lead.col + j;
            if (row < data.length && col < data[0].length) {
              dat[row][col] = arr[i][j];
            }
          }
        }

        setData(dat);
      } catch (err) {
        console.error("Failed to read clipboard:", err);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditing = document.activeElement?.tagName === "INPUT";

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
      if (e.key === "Delete" && !isEditing) {
        e.preventDefault();
        const range = getRange(lead, tail);
        if (!range) return;

        const { imin, imax, jmin, jmax } = range;
        const dat = [...data];

        for (let i = imin; i <= imax; i++) {
          for (let j = jmin; j <= jmax; j++) {
            dat[i][j] = "";
          }
        }
        setData(dat);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lead, tail, data, getRange]);

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

  const isCellInRange = (i: number, j: number): boolean => {
    const range = getRange(lead, tail);
    if (!range) return false;
    const { imin, imax, jmin, jmax } = range;
    return i >= imin && i <= imax && j >= jmin && j <= jmax;
  };

  return (
    <table onPointerUp={onPointerUp}>
      <tbody>
        {data.map((arr, i) => (
          <tr key={i}>
            {arr.map((v, j) => (
              <Td
                key={j}
                i={i}
                j={j}
                val={v}
                bool={coord?.row == i && coord?.col == j}
                className={isCellInRange(i, j) ? "selected" : ""}
                onDoubleClick={() => onDoubleClick(i, j)}
                onChange={onChange}
                onBlur={() => setCoord(null)}
                onKeyDown={onKeyDown}
                onPointerDown={() => onPointerDown(i, j)}
                onPointerEnter={() => onPointerEnter(i, j)}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

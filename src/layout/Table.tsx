import { useState, useEffect } from "react";

// Interface for table header cell props
interface Header {
    val: string;
    onPointerDown: () => void;
}

// Header cell component
function Th({ val, onPointerDown }: Header) {
    return <th onPointerDown={onPointerDown}>{val}</th>;
}

// Interface for table cell props
interface Cell {
    row: number; // Row index
    col: number; // Column index
    val: string; // Cell value
    bool: boolean; // Flag for edit mode
    className: string; // CSS class name
    onBlur: () => void; // Handler when cell loses focus
    onPointerDown: () => void; // Handler for pointer down event
    onPointerEnter: () => void; // Handler for pointer enter event
    onDoubleClick: () => void; // Handler for double click event
    onChange: (row: number, col: number, val: string) => void; // Handler for value change
    onKeyDown: (i: number, j: number, e: React.KeyboardEvent<HTMLInputElement>) => void; // Handler for keyboard events
}

// Table cell component
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
        >
            {bool ? (
                // Render input element when cell is in edit mode
                <input
                    autoFocus
                    onFocus={(e) => e.target.select()} // Select all text when focused
                    value={val}
                    onBlur={onBlur}
                    onChange={(e) => onChange(i, j, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, j, e)}
                />
            ) : (
                // Render plain text when not in edit mode
                val
            )}
        </td>
    );
}

// Interface for table component props
interface TableData {
    header: string[]; // Array of header titles
    data: string[][]; // 2D array of table data
}

export default function Table({ header, data }: TableData) {
    // Types for cell coordinates and range selection
    type CellCoord = { row: number; col: number } | null;
    type CellRange = { imin: number; imax: number; jmin: number; jmax: number };
    const [keys, setKeys] = useState<string[]>(header);
    const [rows, setRows] = useState<string[][]>(data);
    const [coor, setCoor] = useState<CellCoord>(null); // Coordinates of the cell being edited
    const [lead, setLead] = useState<CellCoord>(null); // Coordinates of drag start
    const [tail, setTail] = useState<CellCoord>(null); // Coordinates of drag end
    const [drag, setDrag] = useState<boolean>(false); // state of pointer being dragging

    useEffect(() => {
        setKeys(header);
        setRows(data);
    }, [header, data]);

    // Calculate the range of selected cells
    const getRange = (lead: CellCoord, tail: CellCoord): CellRange | null => {
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
        setCoor({ row: i, col: j });
    };

    // Handle cell value changes
    const onChange = (i: number, j: number, val: string): void => {
        const dat = rows.map((row) => [...row]);
        dat[i][j] = val;
        setRows(dat);
    };

    // Check if a cell is within the selected range
    const isCellInRange = (i: number, j: number): boolean => {
        const range = getRange(lead, tail);
        if (!range) return false;
        const { imin, imax, jmin, jmax } = range;
        return i >= imin && i <= imax && j >= jmin && j <= jmax;
    };

    // Clipboard operations
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
        navigator.clipboard.writeText(clipboardText);
    };

    // Handle paste operation
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

            // Paste data within selected range
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

    // Handle keyboard shortcuts
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
        if (e.key === "Delete" && !coor) {
            e.preventDefault();
            const range = getRange(lead, tail);
            if (!range) return;

            // Clear selected range
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

    // Handle keyboard navigation in edit mode
    const onKeyDownCell = (i: number, j: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
        const deSelect = () => {
            setLead(null);
            setTail(null);
            e.preventDefault();
        };

        // Navigate between cells using arrow keys
        switch (e.key) {
            case "Enter":
            case "ArrowDown":
                deSelect();
                setCoor({ row: i + 1, col: j });
                break;
            case "ArrowUp":
                deSelect();
                setCoor({ row: i - 1, col: j });
                break;
            case "ArrowLeft":
                deSelect();
                setCoor({ row: i, col: j - 1 });
                break;
            case "ArrowRight":
                deSelect();
                setCoor({ row: i, col: j + 1 });
                break;
        }
    };

    // Select entire column when clicking header
    const onPointerDownHeader = (j: number): void => {
        setLead({ row: 0, col: j });
        setTail({ row: data.length, col: j });
    };

    // Render table with header and body
    return (
        <table tabIndex={0} onPointerUp={onPointerUp} onKeyDown={onKeyDown}>
            <thead>
                <tr>
                    {keys.map((v, j) => (
                        <Th key={`col${j}`} val={v} onPointerDown={() => onPointerDownHeader(j)} />
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
                                bool={coor?.row == i && coor?.col == j}
                                className={isCellInRange(i, j) ? "selected" : ""}
                                onBlur={() => setCoor(null)}
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

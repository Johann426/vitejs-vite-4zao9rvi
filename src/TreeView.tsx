import { useState, useEffect } from "react";

interface ItemData {
  label: string;
  obj: object;
}

function Item({ label, obj }: ItemData) {
  return (
    <li
      draggable
      // style={{ cursor: "grab" }}
      // onDragStart={() => console.log("t")}
    >
      {label}
    </li>
  );
}

interface GroupData {
  label: string;
  obj: object;
  bool: boolean; // boolean indicating folded state
  group: GroupData[] | null; // list of sub group
  items: ItemData[] | null; // lisst of items
}

function Group({ label, obj, bool, group, items }: GroupData) {
  return (
    <li>
      <span>{label}</span>
      {bool && ( // if true, render subgroup and items
        <ul>
          {group?.map((v, i) => (
            <Group
              key={`${v.label}-subgroup${i}`}
              label={v.label}
              obj={v.obj}
              bool={v.bool}
              group={v.group}
              items={v.items}
            />
          ))}
          {items?.map((v, i) => (
            <Item key={`${v.label}-item${i}`} label={v.label} obj={v.obj} />
          ))}
        </ul>
      )}
    </li>
  );
}

interface TreeData {
  groupList: GroupData[];
  itemList: ItemData[];
}

export default function TreeView({ groupList, itemList }: TreeData) {
  const [coord, setCoord] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [group, setGroup] = useState<GroupData[] | null>(groupList); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(itemList);
  const [cntxt, setCntxt] = useState(false);

  const ContextMenu = ({
    x,
    y,
    bool,
    onNewItem,
    onNewGroup,
  }: {
    x: number;
    y: number;
    bool: boolean;
    onNewItem: () => void;
    onNewGroup: () => void;
  }) => {
    const onPointerDown = (e, str: string) => {
      e.stopPropagation();
      console.log(str);
    };

    return (
      <>
        {bool && (
          <div
            style={{
              position: "absolute",
              top: y,
              left: x,
              zIndex: 1000,
            }}
          >
            <div
              onPointerDown={(e) => {
                e.stopPropagation(); //prevent from being closed before executing callback
                onNewGroup();
                setCntxt(false);
              }}
            >
              New Group
            </div>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                onNewItem();
                setCntxt(false);
              }}
            >
              New Item
            </div>
            <hr />
            <div onPointerDown={(e) => console.log(e, "Rename")}>Rename</div>
            <div onPointerDown={(e) => onPointerDown(e, "Delete")}>Delete</div>
          </div>
        )}
      </>
    );
  };

  const onPointerDown = (): void => {
    setCntxt(false);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCntxt(true);
    setCoord({ x: e.clientX, y: e.clientY });
  };

  const onNewItem = () => {
    const newItems = items?.slice();
    if (newItems) {
      newItems.push({ label: "new item", obj: Object() });
      setItems(newItems);
    } else {
      setItems([{ label: "new item", obj: Object() }]);
    }
  };

  const onNewGroup = () => {
    const newGroup = {
      label: "new group",
      obj: Object(),
      bool: false,
      group: null,
      items: null,
    };
    if (group) {
      const copy = group.slice();
      copy.push(newGroup);
      setGroup(copy);
    } else {
      setGroup([newGroup]);
    }
  };

  return (
    <div onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <ul onPointerDown={onPointerDown}>
        {group?.map((v, i) => (
          <Group
            key={`${v.label}-subgroup${i}`}
            label={v.label}
            obj={v.obj}
            bool={v.bool}
            group={v.group}
            items={v.items}
          />
        ))}
        {items?.map((v, i) => (
          <Item key={`${v.label}-item${i}`} label={v.label} obj={v.obj} />
        ))}
      </ul>
      <ContextMenu
        x={coord.x}
        y={coord.y}
        bool={cntxt}
        onNewGroup={onNewGroup}
        onNewItem={onNewItem}
      />
    </div>
  );
}

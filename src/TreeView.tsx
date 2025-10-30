import { useState, useEffect } from "react";

interface ItemData {
  label: string;
  obj: object;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerLeave: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

function Item({
  label,
  obj,
  onClick,
  onPointerOver,
  onPointerLeave,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: ItemData) {
  const [className, setClassName] = useState("item");

  return (
    <li className={className}
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
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

function Group({
  label,
  obj,
  bool,
  group,
  items,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: GroupData) {
  
  const [className, setClassName] = useState("folder");

  return (
    <li>
      <span className={className}>{label}</span>
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

  const onClick = (e) => {
    // editor.select( mesh );
    e.target.className = "selected";
  };

  const onPointerOver = () => {
    // const mesh = scope.map.get( event.target );
    // scope.savedColor = mesh.material.color.getStyle();
    // mesh.material.color.setRGB( 255, 255, 255 );
  };

  const onPointerLeave = () => {
    // const mesh = scope.map.get( event.target );
    // mesh.material.color.set( scope.savedColor );
  };

  const onDragStart = (event) => {
    // scope.dragged = event.target;
    // event.target.classList.add("dragging");
  };

  const onDragEnd = (event) => {
    // scope.dragged = 0;
    // event.target.classList.remove("dragging");
  };

  const onDragLeave = () => {
    // if (scope.dragged === event.target) return;
    // event.target.classList.remove("dragTop", "dragBottom", "dragOver");
  };

  const onDragOver = () => {
    // event.preventDefault(); // prevent default to allow drop event
    // event.stopPropagation(); // Prevent event from reaching child nodes
    // if (scope.dragged === event.target) return;
    // const area = event.offsetY / event.target.clientHeight;
    // if (area <= 0.5) {
    //   event.target.classList.remove("dragBottom");
    //   event.target.classList.add("dragTop");
    // } else if (area > 0.5) {
    //   event.target.classList.remove("dragTop");
    //   event.target.classList.add("dragBottom");
    // }
  };

  const onDrop = () => {
    // event.preventDefault();
    // const ul = event.target.parentElement;
    // const li =
    //   scope.dragged.tagName == "LI"
    //     ? scope.dragged
    //     : scope.dragged.parentElement;
    // if (event.target === scope.dragged) return;
    // const area = event.offsetY / this.clientHeight;
    // // move to new position (insertElement does not create a copy)
    // event.target.insertAdjacentElement(
    //   area < 0.5 ? "beforebegin" : "afterend",
    //   li
    // );
    // event.target.classList.remove("dragTop", "dragBottom");
  };

  // function onDragOver(event) {}
  // function onDropFolder(event) {}

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

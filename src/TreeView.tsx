import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';

interface ItemData {
  label: string;
  obj: object;
}

function Item({ label, obj, ...callbacks }: ItemData) {
  const [className, setClassName] = useState("model");

  const onClick = () => {
    setClassName('selected')
  }

  const onDragStart = () => setClassName('dragging')

  const onDragEnd = () => setClassName('model')

  const onDragLeave = () => setClassName('model')

  const onDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("dragOver")
    setClassName('dragOver')
  }

  const onDrop = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    console.log('Dropped!');
  };

  return (
    <li
      className={className}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      {...callbacks}
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

function Group({
  label,
  obj,
  bool,
  group,
  items,
  ...callbacks
}: GroupData) {
  const [open, setOpen] = useState(bool); //boolean for state opened & display inside folder

  const onClick = () => {
    setOpen((prev) => !prev); // toggle boolean
  }

  return (
    <li className={open ? "group-opened" : "group"}>
      <span
        onClick={onClick}
        {...callbacks}
      >
        {label}
      </span>
      {open && ( // if true, render subgroup and items
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

interface TreeData extends React.HTMLAttributes<HTMLDivElement> {
  groupList: GroupData[];
  itemList: ItemData[];
}

export default function TreeView({ groupList, itemList, ...callbacks }: TreeData) {
  const [coord, setCoord] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [group, setGroup] = useState<GroupData[] | null>(groupList); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(itemList);
  const [open, setOpen] = useState(false); // state of context menu opened
  const [area, setArea] = useState<string | null>(null); // target area of dragOver and possibly drop region

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
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, str: string) => {
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
                setOpen(false);
              }}
            >
              New Group
            </div>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                onNewItem();
                setOpen(false);
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
    setOpen(false);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
    setCoord({ x: e.clientX, y: e.clientY });
  };

  const onDragOver = (key: string) => (e: React.DragEvent<HTMLElement>) => {

    e.preventDefault(); // prevent default to allow drop event
    e.stopPropagation(); // prevent event target reaching from child nodes

    const offsetY = (e.nativeEvent as MouseEvent).offsetY;
    const height = (e.currentTarget as HTMLElement).clientHeight;
    const area = offsetY / height;

    console.log(key)
    // setArea(key);

    // if (area <= 0.5) {

    //   area.classList.remove('dragBottom');
    //   area.classList.add('dragTop');

    // } else if (area > 0.5) {

    //   area.classList.remove('dragTop');
    //   area.classList.add('dragBottom');

    // }

  }

  const onPointerOver = () => {
    // const mesh = scope.map.get( event.target );
    // scope.savedColor = mesh.material.color.getStyle();
    // mesh.material.color.setRGB( 255, 255, 255 );
  };

  const onPointerLeave = () => {
    // const mesh = scope.map.get( event.target );
    // mesh.material.color.set( scope.savedColor );
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
    <div onPointerDown={onPointerDown} onContextMenu={onContextMenu} {...callbacks}>
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
          // <Item key={`${v.label}-item${i}`} label={v.label} obj={v.obj} {...{ onDragOver: onDragOver(`${v.label}-item${i}`) }} /> // to do: if key => setClass
        ))}
      </ul>
      {createPortal(// createPortal to avoid layout constraints of parent
        <ContextMenu
          x={coord.x}
          y={coord.y}
          bool={open}
          onNewGroup={onNewGroup}
          onNewItem={onNewItem}
        />,
        document.body // render contextMenu directly into <body>
      )}
    </div>
  );
}

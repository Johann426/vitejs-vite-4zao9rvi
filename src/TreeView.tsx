import { useState, useEffect } from "react";

interface ItemData {
  label: string;
  obj: object;
}

function Item({ label, obj }: ItemData) {
  const [key, setKey] = useState<string>(label);
  return <li>{key}</li>;
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
  const [group, setGroup] = useState<GroupData[] | null>(groupList); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(itemList);

  const onPointerDown = (): void => {
    const newItems = items?.slice();
    if (newItems) {
      newItems.push({ label: "new item", obj: Object() });
      setItems(newItems);
    } else {
      setItems([{ label: "new item", obj: Object() }]);
    }
  };

  return (
    <div>
      <ul onPointerDown={onPointerDown}>
        {group?.map((e) => (
          <Group
            label={e.label}
            obj={e.obj}
            bool={e.bool}
            group={e.group}
            items={e.items}
          />
        ))}
        {items?.map((e) => (
          <Item label={e.label} obj={Object()} />
        ))}
      </ul>
    </div>
  );
}

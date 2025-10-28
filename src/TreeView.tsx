import { useState, useEffect } from "react";

type ItemData = {
  label: string;
  obj: object;
};

type GroupData = {
  label: string;
  obj: object;
  bol: boolean; // boolean indicating folded state
  group: GroupData[] | null; // list of sub group
  items: ItemData[] | null; // lisst of items
};

function Item({ label, obj }: ItemData) {
  const [key, setKey] = useState<string>(label);
  return <li>{key}</li>;
}

function Group({ label, obj, bol, group, items }: GroupData) {
  const [key, setKey] = useState<string>(label);
  const [grp, setGrp] = useState<GroupData[] | null>(group); // subgroup
  const [itm, setItm] = useState<ItemData[] | null>(items);

  return (
    <li>
      <span>{key}</span>
      <ul>
        {grp?.map((v, i) => (
          <Group label={`group${i}`} obj = {v.obj} bol = {v.bol} group={v.group} items={v.items}/>
        ))}
        {itm?.map((v, i) => (
          <Item label={`item${i}`} obj={v.obj} />
        ))}
      </ul>
    </li>
  );
}

export default function TreeView() {
  const [group, setGroup] = useState<GroupData[] | null>(null); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(null);
  
  const onPointerDown = (): void => {
    const newItems = items?.slice()
    if(newItems) {
      newItems.push({label: "new item", obj:Object()})
      setItems(newItems)
    } else {
      setItems([{label: "new item", obj:Object()}])
    }
  };

  return (
    <ul onPointerDown={onPointerDown}>
      <Group label="Grroup 1" obj = {Object()} bol = {true} group={null} items={null}/>
      {items?.map( e => <Item label={e.label} obj={Object()}/> )}
    </ul>
  );
}

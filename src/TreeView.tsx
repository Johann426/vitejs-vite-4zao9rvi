import { useState, useEffect } from "react";

type ItemData = {
  label: string;
};

type GroupData = {
  label: string;
  group: GroupData[] | null; // list of sub group
  items: ItemData[] | null; // lisst of items
};

function Item({ txt }: { txt: string }) {
  const [label, setlabel] = useState<string>(txt);
  return <li>{label}</li>;
}

function Group({ txt }: { txt: string }) {
  const [label, setlabel] = useState<string>(txt);
  const [group, setGroup] = useState<GroupData[] | null>(null); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(null);

  return (
    <li>
      <span>{label}</span>
      <ul>
        {group?.map((v, i) => (
          <Group key={i} txt={v.label} />
        ))}
        {items?.map((v, i) => (
          <Item key={i} txt={v.label} />
        ))}
      </ul>
    </li>
  );
}

export default function TreeView() {
  const [group, setGroup] = useState<GroupData[] | null>(null); // subgroup
  const [items, setItems] = useState<ItemData[] | null>(null);
  const onPointerDown = (): void => {
    console.log("hello");
  };

  return (
    <ul onPointerDown={onPointerDown}>
      <Group txt="Group1" />
      <Item txt="item 1" />
      <Item txt="item 2" />
    </ul>
  );
}

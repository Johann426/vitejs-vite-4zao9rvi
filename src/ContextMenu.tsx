import { Menu } from "@mantine/core";

export default function ContextMenu() {
  const onClick = (str: string) => {
    console.log(str);
  };

  return (
    <Menu shadow="md" width={200} opened={true}>
      <Menu.Target>
        <button className="hidden"></button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => onClick("New Group")}>New Group</Menu.Item>
        <Menu.Item onClick={() => onClick("New Curve")}>New Curve</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => onClick("Rename")}>Rename</Menu.Item>
        <Menu.Item onClick={() => onClick("Delete")}>Delete</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

import { useCallback, useRef } from "react";

export function ContextMenuTrigger(
  callback: (x: number, y: number) => void,
  delay = 600
) {
  const timerRef = useRef<number | null>(null);

  const onPointerDown = () => {
    const menu = document.getElementById("context-menu");
    if (menu) menu.style.display = "none"; // 숨기기
    console.log(menu);
  };

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      callback(e.clientX, e.clientY);
    },
    [callback]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      timerRef.current = window.setTimeout(() => {
        callback(touch.clientX, touch.clientY);
      }, delay);
    },
    [callback, delay]
  );

  const onTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onPointerDown,
    onContextMenu,
    onTouchStart,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  };
}

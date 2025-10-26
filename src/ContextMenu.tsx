import { useState } from 'react';
import { Button, Menu, Text } from '@mantine/core';

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
        <Menu.Item onClick={() => onClick('New Group')}>New Group</Menu.Item>
        <Menu.Item onClick={() => onClick('New Curve')}>New Curve</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => onClick('Rename')}>Rename</Menu.Item>
        <Menu.Item onClick={() => onClick('Delete')}>Delete</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

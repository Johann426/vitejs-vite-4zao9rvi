import { useState } from "react";
import { Menu, Button, Text } from "@mantine/core";
import classes from "./Menubar.module.css";

function File() {
  return (
    <Menu trigger="hover" position="bottom-start" offset={-1} width={200} classNames={classes}>
      <Menu.Target>
        <Button variant="transparent">File</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>New</Menu.Item>
        <Menu.Divider />
        <Menu.Item>Save</Menu.Item>
        <Menu.Item>Open</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

import { Temp } from "../temp.js";

function onAddPoint() {
  const temp = new Temp(10);
  temp.foo();
}

function Edit() {
  onAddPoint();

  return (
    <Menu trigger="hover" position="bottom-start" offset={-1} width={300} classNames={classes}>
      <Menu.Target>
        <Button variant="transparent">Edit</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>Add Point</Menu.Item>
        <Menu.Item>Add Tangent</Menu.Item>
        <Menu.Item>Remove Point</Menu.Item>
        <Menu.Item>Remove Tangent</Menu.Item>
        <Menu.Item>Add Knuckle</Menu.Item>
        <Menu.Item>Remove Knuckle</Menu.Item>
        <Menu.Item>Knot Insert</Menu.Item>
        <Menu.Item>Knot Removal</Menu.Item>
        <Menu.Item>Insert Point</Menu.Item>
        <Menu.Item>Bspline decompost into Bezier</Menu.Item>
        <Menu.Item>Degree elevation</Menu.Item>
        <Menu.Item>Elevate Degree of Bezier</Menu.Item>
        <Menu.Item>Split</Menu.Item>
        <Menu.Item>Intersect</Menu.Item>
        <Menu.Item>Trim</Menu.Item>
        <Menu.Item>Surface Knot Insert</Menu.Item>
        <Menu.Divider />
        <Menu.Item>Delete</Menu.Item>
        <Menu.Item rightSection={<Text>ctrl+C</Text>}>Copy</Menu.Item>
        <Menu.Item rightSection={<Text>ctrl+X</Text>}>Cut</Menu.Item>
        <Menu.Item rightSection={<Text>ctrl+P</Text>}>Paste</Menu.Item>
        <Menu.Divider />
        <Menu.Item rightSection={<Text>ctrl+Z</Text>}>Undo</Menu.Item>
        <Menu.Item rightSection={<Text>ctrl+Y</Text>}>Redo</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function Curve() {
  return (
    <Menu trigger="hover" position="bottom-start" offset={-1} width={300} classNames={classes}>
      <Menu.Target>
        <Button variant="transparent">Curve</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>Line</Menu.Item>
        <Menu.Item>Arc</Menu.Item>
        <Menu.Item>Circle</Menu.Item>
        <Menu.Divider />
        <Menu.Item>Bezier</Menu.Item>
        <Menu.Item>Bspline</Menu.Item>
        <Menu.Item>Nurbs</Menu.Item>
        <Menu.Divider />
        <Menu.Item>Interpolated Spline</Menu.Item>
        <Menu.Item disabled>Offset Curve</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function Surface() {
  return (
    <Menu trigger="hover" position="bottom-start" offset={-1} width={300} classNames={classes}>
      <Menu.Target>
        <Button variant="transparent">Surface</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>Bilinear</Menu.Item>
        <Menu.Item>Ruled</Menu.Item>
        <Menu.Item>Extruded</Menu.Item>
        <Menu.Item>Revolved</Menu.Item>
        <Menu.Item>Lofted</Menu.Item>
        <Menu.Item>Networked</Menu.Item>
        <Menu.Item>Offset Surface</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {
  editor: object;
}

export default function Menubar({ editor, ...rest }: MenubarProps) {
  return (
    <div {...rest}>
      <File />
      <Edit />
      <Curve />
      <Surface />
    </div>
  );
}

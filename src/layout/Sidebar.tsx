import React, { useState, useRef, useEffect } from "react";
import type Editor from "../Editor";
import { Tabs } from "@mantine/core";
import { IconLayersSubtract, IconChartBarPopular, IconSettings } from "@tabler/icons-react";
import TreeView from "./TreeView";
import type { GroupData, ItemData } from "./TreeView";
import Setting from "./Setting";
import { BsplineCurveInt } from "../modeling/BsplineCurveInt";
import { Vector } from "../modeling/NurbsLib";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

const defaultGroup: GroupData = {
    label: "default group",
    obj: {},
    bool: true,
    group: [],
    items: [{ label: "default item", obj: {} }],
};
const item1: ItemData = { label: "item1", obj: {} }
const item2: ItemData = { label: "item2", obj: {} };


export default function Sidebar({ editor, ...rest }: SidebarProps) {
    const [groups, setGroups] = useState([defaultGroup]);
    const [items, setItems] = useState([item1, item2]);

    // Set group list & item list when the component mounts
    useEffect(() => {

        setGroups([defaultGroup]);

        const arr = editor.pickables.map(mesh => {
            const item = { label: "new curve", obj: mesh };
            return item;
        })
        setItems(arr);

        // Cleanup when component unmounts
        return () => {
            setGroups([]);
            setItems([]);
        };
    }, [editor.pickables.length]); // re-render with changed dependencies

    const onNewGroup = () => {

        return {
            label: "new group",
            obj: Object(),
            bool: false, // boolean indicating folded state
            group: [], // list of sub group
            items: [], // lisst of items
        }
    };

    const onNewItem = () => {

        editor.addInterpolatedSpline();
        const mesh = editor.selectMesh.pickedObject;

        return {
            label: "mew mesh",
            obj: mesh!,
        }
    };

    return (
        <div {...rest}>
            <Tabs color="indigo" variant="outline" defaultValue="layer">
                <Tabs.List justify="space-between">
                    <Tabs.Tab value="layer" leftSection={<IconLayersSubtract size={12} />}>
                        Layer
                    </Tabs.Tab>
                    <Tabs.Tab value="properties" leftSection={<IconChartBarPopular size={12} />}>
                        Properties
                    </Tabs.Tab>
                    <Tabs.Tab value="settings" leftSection={<IconSettings size={12} />}>
                        Settings
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="layer" p="xs">
                    Tree view
                    {/* <TreeView id="treeview" groupList={groups} itemList={items} onNewGroup={ } onNewItem={ } /> */}
                    <TreeView id="treeview" groupList={groups} itemList={items} onNewItem={onNewItem} />
                </Tabs.Panel>

                <Tabs.Panel value="properties" p="xs">
                    Properties tab content
                </Tabs.Panel>

                <Tabs.Panel value="settings" p="xs">
                    <Setting />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}

import React, { useState, useRef, useEffect } from "react";
import type Editor from "../Editor";
import { Tabs } from "@mantine/core";
import { IconLayersSubtract, IconChartBarPopular, IconSettings } from "@tabler/icons-react";
import TreeView from "./TreeView";
import Setting from "./Setting";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

const defaultGroup: GroupProps = {
    label: "default group",
    obj: {},
    bool: true,
    group: [],
    items: [{ label: "default item", obj: {} }],
};
const item1 = { label: "item1", obj: {} }
const item2 = { label: "item2", obj: {} };

interface GroupProps {
    label: string,
    obj: Object,
    bool: boolean,
    group: GroupProps[],
    items: ItemProps[],
}

interface ItemProps {
    label: string,
    obj: Object,
}

export default function Sidebar({ editor, ...rest }: SidebarProps) {
    const [groups, setGroups] = useState([defaultGroup]);
    const [items, setItems] = useState([item1, item2]);

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
                    <TreeView id="treeview" groupList={groups} itemList={items} />
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

import React, { useState, useEffect } from "react";
import { Tabs } from "@mantine/core";
import { IconLayersSubtract, IconChartBarPopular, IconSettings } from "@tabler/icons-react";
import TreeView from "./TreeView";
import Setting from "./Setting";
import type Editor from "../Editor";
import type { GroupData, ItemData } from "./TreeView";
import type TreeNode from "../events/TreeModel";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

const defaultGroup: GroupData = {
    id: "",
    label: "root",
    obj: {},
    bool: true,
    group: [],
    items: [{ id: "", label: "", obj: {} }],
};

export default function Sidebar({ editor, ...rest }: SidebarProps) {
    const [groups, setGroups] = useState<GroupData[]>([defaultGroup]);
    const [items, setItems] = useState<ItemData[]>([]);

    const { treeNode } = editor;
    // Set group list & item list when the component mounts
    useEffect(() => {

        // add callback to update treeview
        const observer = treeNode.add(() => {

            function getDataFromTreeNode(node: TreeNode): GroupData {

                return {
                    id: node.id,
                    label: node.label,
                    obj: {},
                    bool: node.bool,
                    group: node.group.map(e => getDataFromTreeNode(e)),
                    items: node.items.map(e => ({ id: e.id, label: e.label, obj: e.obj }))
                }
            }

            const group = getDataFromTreeNode(treeNode);

            setGroups([group]);

        })

        // Cleanup when component unmounts
        return () => {
            treeNode.remove(observer);
        };
    }, [treeNode.group.length]); // re-render with changed dependencies

    const onNewGroup = () => {

        return treeNode.newGroup("new group");
    };

    const onNewItem = () => {

        editor.addInterpolatedSpline();

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
                    <TreeView id="treeview" groupList={groups} itemList={items} onNewGroup={onNewGroup} onNewItem={onNewItem} />
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

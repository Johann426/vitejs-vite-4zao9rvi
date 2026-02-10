import React, { useState } from "react";
import { Tabs } from "@mantine/core";
import { IconLayersSubtract, IconChartBarPopular, IconSettings } from "@tabler/icons-react";
import TreeView from "./TreeView";
import Setting from "./Setting";
import type Editor from "../Editor";
import type { GroupData } from "./TreeView";
import type TreeNode from "../events/TreeNode";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

export default function Sidebar({ editor, ...rest }: SidebarProps) {
    const { treeNode } = editor;
    const [data, setData] = useState<GroupData>(treeNode);

    // add callback to notify and update treeview using React Hook(useState)
    treeNode.add(() => {
        // change ref. value to trigger re-render
        // const tree = getDataFromTreeNode(treeNode);
        const tree = { ...treeNode }
        setData(tree);
    })

    const onNewGroup = () => {
        treeNode.newGroup("new group");
    };

    const onNewItem = () => {
        editor.addInterpolatedSpline()
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
                    <TreeView id="treeview" data={data} onNewGroup={onNewGroup} onNewItem={onNewItem} />
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
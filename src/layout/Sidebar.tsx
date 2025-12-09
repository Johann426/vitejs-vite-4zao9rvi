import { Tabs } from "@mantine/core";
import { IconLayersSubtract, IconChartBarPopular, IconSettings } from "@tabler/icons-react";
import TreeView from "./TreeView";
import Setting from "./Setting";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: object;
}

const group = {
    label: "subgroup",
    obj: Object(),
    bool: true,
    group: null,
    items: [{ label: "sub item", obj: Object() }],
};
const item1 = { label: "item1", obj: Object() };
const item2 = { label: "item2", obj: Object() };

export default function Sidebar({ editor, ...rest }: SidebarProps) {
    return (
        <div {...rest}>
            <Tabs color="indigo" variant="outline" defaultValue="settings">
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
                    <TreeView id="treeview" groupList={[group]} itemList={[item1, item2]} />
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

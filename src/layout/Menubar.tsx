import classes from "./Menubar.module.css";
import { Menu, Button, Text, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUpload, IconFile, IconDownload } from "@tabler/icons-react";
import type Editor from "../Editor";
import { BsplineCurveInt } from "../modeling/BsplineCurveInt";

function File() {
    const [opened, { open, close }] = useDisclosure(false);

    const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target);
        const file = e.target.files?.[0];
        if (file) {
            console.log("Selected file:", file.name);
            // You can process the file here
        }
    };

    const onClickSave = () => { };

    return (
        <Menu trigger="hover" position="bottom-start" offset={-1} width={200} classNames={classes}>
            <Menu.Target>
                <Button variant="transparent">File</Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={open}>New</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconDownload size={14} />} onClick={onClickSave}>
                    Save
                </Menu.Item>
                <Menu.Item leftSection={<IconFile size={14} />} component="label">
                    Open
                    <input type="file" hidden onChange={onChangeFile} />
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item>Import</Menu.Item>
            </Menu.Dropdown>
            <Modal opened={opened} onClose={close} withCloseButton={false}>
                <Text>New project will discard any unsaved data. Do you want to continue?</Text>
                <Group justify="center">
                    <Button onClick={() => location.reload()}>yes</Button>
                    <Button color="gray" onClick={close}>
                        no
                    </Button>
                </Group>
            </Modal>
        </Menu>
    );
}

function Edit() {
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

interface CurveProps {
    editor: Editor;
}

function Curve({ editor }: CurveProps) {

    const onClickInterpolatedSpline = () => {
        const curve = new BsplineCurveInt(3);
        editor.addCurve(curve);

        const mesh = editor.pickables[editor.pickables.length - 1];
        editor.editMesh.registerMesh(mesh);
        editor.selectMesh.pickedObject = mesh;
    }

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
                <Menu.Item onClick={onClickInterpolatedSpline}>
                    Interpolated Spline
                </Menu.Item>
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
    editor: Editor;
}

export default function Menubar({ editor, ...rest }: MenubarProps) {
    return (
        <div {...rest}>
            <File />
            <Edit />
            <Curve editor={editor} />
            <Surface />
        </div>
    );
}

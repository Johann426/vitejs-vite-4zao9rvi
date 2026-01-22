import classes from "./Menubar.module.css";
import { Menu, Button, Text, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUpload, IconFile, IconDownload } from "@tabler/icons-react";
import type Editor from "../Editor";
import { BsplineCurveInt } from "../modeling/BsplineCurveInt";
import { Vector } from "../modeling/NurbsLib";
import { useState } from "react";

interface Props {
    editor: Editor;
}

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

    const onClickSave = () => {};

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

function Edit({ editor }: Props) {
    const [disabled, setDisabled] = useState(false);
    const { editMesh, sketchInput } = editor;

    const onClickUndo = () => {
        editor.undo();
    };

    const onClickRedo = () => {
        editor.redo();
    };

    const onClickAddPoint = () => {
        const { scene, selectMesh } = editor;
        const mesh = selectMesh.pickedObject;
        if (!mesh) return;

        sketchInput.callback = {
            onPointerMove: (v: Vector) => {},
            onPointerDown: (v: Vector) => {
                const { curve } = mesh.metadata;
                curve.append(new Vector(v.x, v.y, v.z));
                editor.updateCurveMesh(mesh);
            },
            onPointerUp: (v: Vector) => {},
        };

        selectMesh.removeCallbacks(scene);
        sketchInput.registerCallbacks(scene);
    };

    return (
        <Menu trigger="hover" position="bottom-start" offset={-1} width={300} classNames={classes}>
            <Menu.Target>
                <Button
                    variant="transparent"
                    onMouseEnter={() => {
                        setDisabled(editor.selectMesh.pickedObject ? false : true);
                    }}
                >
                    Edit
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={onClickAddPoint} disabled={disabled}>
                    Add Point
                </Menu.Item>
                <Menu.Item disabled={disabled}>Add Tangent</Menu.Item>
                <Menu.Item disabled={disabled}>Remove Point</Menu.Item>
                <Menu.Item disabled={disabled}>Remove Tangent</Menu.Item>
                <Menu.Item disabled={disabled}>Add Knuckle</Menu.Item>
                <Menu.Item disabled={disabled}>Remove Knuckle</Menu.Item>
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
                <Menu.Item disabled={disabled}>Delete</Menu.Item>
                <Menu.Item rightSection={<Text>ctrl+C</Text>}>Copy</Menu.Item>
                <Menu.Item rightSection={<Text>ctrl+X</Text>}>Cut</Menu.Item>
                <Menu.Item rightSection={<Text>ctrl+P</Text>}>Paste</Menu.Item>
                <Menu.Divider />
                <Menu.Item rightSection={<Text>ctrl+Z</Text>} onClick={onClickUndo}>
                    Undo
                </Menu.Item>
                <Menu.Item rightSection={<Text>ctrl+Y</Text>} onClick={onClickRedo}>
                    Redo
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}

function Curve({ editor }: Props) {
    const { editMesh, sketchInput } = editor;

    const onClickInterpolatedSpline = () => {
        const { scene, selectMesh, pickables } = editor;

        const addInterpolatedSpline = () => {
            const curve = new BsplineCurveInt(3);
            let flag: boolean = true;
            editor.addCurve(curve);

            const mesh = pickables[pickables.length - 1];
            selectMesh.pickedObject = mesh;

            sketchInput.callback = {
                onPointerMove: (v: Vector) => {
                    // if (flag) {
                    //     curve.append(new Vector(v.x, v.y, v.z))
                    //     flag = false;
                    // } else {
                    //     const index = curve.designPoints.length - 1;
                    //     curve.modify(index, new Vector(v.x, v.y, v.z));
                    //     editor.updateCurveMesh(mesh);
                    // }
                    curve.append(new Vector(v.x, v.y, v.z));
                    editor.updateCurveMesh(mesh);
                    const index = curve.designPoints.length - 1;
                    curve.remove(index);
                },
                onPointerDown: (v: Vector) => {
                    editor.addPoint(v);
                    // flag = true;
                },
                onPointerUp: (v: Vector) => {},
            };

            selectMesh.removeCallbacks(scene);
            sketchInput.registerCallbacks(scene);
        };

        addInterpolatedSpline();
        editor.repeat = addInterpolatedSpline;
    };

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
                <Menu.Item onClick={onClickInterpolatedSpline}>Interpolated Spline</Menu.Item>
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
            <Edit editor={editor} />
            <Curve editor={editor} />
            <Surface />
        </div>
    );
}

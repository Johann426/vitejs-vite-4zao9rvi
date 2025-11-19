import { useMantineColorScheme, Flex, Text, Select, } from '@mantine/core';

const W = 120;

export default function Setting() {
  const data = ['dark', 'light', 'auto']
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Flex align={"center"}>
      <Text w={W}>Color Theme</Text>
      <Select
        // label="Color Theme"
        data={data}
        defaultValue="auto"
        onChange={value => {
          if (value) setColorScheme(value as 'dark' | 'light' | 'auto');
        }}
      />
    </Flex>
  );
}

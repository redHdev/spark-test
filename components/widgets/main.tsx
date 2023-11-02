import { useState } from 'react';
import { Box, Flex, Text, Paper, useMantineTheme, ActionIcon, Center } from "@mantine/core";
import ModWidget from './modWidget';
import icons, { IconNames } from '../icons/icons';
import { IconSettings, IconArrowsExchange } from '@tabler/icons-react';
import { lighten } from 'polished';
import { useSelectedItem } from '../../context/SettingsContext';

const blendWithWhite = (r: number, g: number, b: number, a: number) => {
  const inverseAlpha = 1 - a;
  r = Math.round((r * a) + (255 * inverseAlpha));
  g = Math.round((g * a) + (255 * inverseAlpha));
  b = Math.round((b * a) + (255 * inverseAlpha));

  const rgbValues = [r, g, b].map(v => {
    let hex = v.toString(16);
    if (hex.length < 2) {
      hex = '0' + hex;
    }
    return hex;
  });
  return `#${rgbValues.join('')}`;
};

const renderIcon = (name: string, color: string | undefined) => {
  let XIcon: any = null;
  let rgbaIconColor: string | undefined = color;

  if (name in icons) {
    const iconName = name as IconNames;
    XIcon = icons[iconName];
    if (typeof color === 'string') {
        const lightenedColor = lighten(0.2, color);
        if (typeof lightenedColor === 'string') {
          const rgbValues = lightenedColor.match(/\w\w/g);
          if (rgbValues) {
            const [r, g, b] = rgbValues.map((i: string) => parseInt(i, 16));
            // Extract alpha value from the color, you can adjust this value as per your requirements
            const a = 0.3;
            // Convert rgba to hex considering opacity on a white background
            rgbaIconColor = blendWithWhite(r, g, b, a);
          }
        }
    }
  } else {
    XIcon = IconSettings;
  }

  return (
    XIcon ? (
      <Box style={{ backgroundColor: rgbaIconColor, display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5%',
                width:'100%',
                height:'8vh',
                borderRadius: '7px' }}>
        <XIcon width={50} height={50}  color={color} />
      </Box>
    ) : (
        <div>Icon: {name} not found</div>
    )
  );
};

export default function ModWidgetMain() {
  const { selectedItem, setSelectedItem } = useSelectedItem();
  const [isOpen, setIsOpen] = useState(true);
  const theme = useMantineTheme();

  const handleItemSelected = (item: any) => {
      setSelectedItem(item);
      setIsOpen(false);
  };

  return (
    <>
    <Flex direction="row" align="center" justify="center" style={{padding:'20px'}}>
    <Box style={{border:'1px solid rgba(160,160,160,0.065)', padding:'1%', maxHeight:'70vh', width:'100%', borderRadius:'7px'}}>
      {isOpen && (
        <Box>
        <ModWidget onItemSelected={handleItemSelected} />
        </Box>
      )}
      {!isOpen && selectedItem && (
        <>
        <Flex align="center" justify="center">
          <Paper
            style={{
              cursor: 'pointer',
              padding:'1%',
              width:"100%",
              borderRadius: theme.radius.md,
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.white,
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = theme.shadows.xs}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            onClick={() => setIsOpen(true)}
          >
            <Flex>
              <Box>
                {renderIcon(selectedItem.xIcon, selectedItem.iconColor)}
              </Box>
              <Box ml="2%">
                <Text>{selectedItem.xTitle}</Text>
                <Text size="sm" color="dimmed" weight="60%" w="72.5%">
                  {selectedItem.xDescription}
                </Text>
              </Box>
              <Center>
                <ActionIcon variant="subtle" color="dark" size="xl" style={{position:'absolute', right:'35px'}} onClick={() => setIsOpen(true)}><IconArrowsExchange/></ActionIcon>
              </Center>
            </Flex>
          </Paper>
        </Flex>
        </>
      )}
    </Box>
    </Flex>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Text, Box, Input, useMantineTheme, List, Flex, ScrollArea } from "@mantine/core";

import icons, { IconNames } from '../icons/icons';
import { IconSettings } from '@tabler/icons-react';
import { lighten } from 'polished';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

type ModType = {
  mymods: any;
  mymodpack: any;
  xTitle: string;
  xDescription: string;
  xProduct: string;
  xType: string;
  xPrompt: string;
  xIcon: string;
  iconColor: string;
  xAuthor?: string;
  xTags?: string[];
};


interface ModWidgetProps {
  onItemSelected: (item: ModType) => void;
}


export default function ModWidget({ onItemSelected }: ModWidgetProps) {
  const [mod, setMod] = useState<ModType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useMantineTheme();

  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;

  const selectItem = (item: ModType) => {
    if (typeof onItemSelected === 'function') {
      onItemSelected(item);
    } else {
      console.error('onItemSelected is not a function or not defined');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabaseClient
        .from('user_mods')
        .select('mymods, mymodpack')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Failed to fetch mods", error);
      } else {
        setMod(fetchedData.mymods);
      }
    };

    fetchData();
  }, [userId, supabaseClient]);

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
              const a = 0.3;
              rgbaIconColor = blendWithWhite(r, g, b, a);
            }
          }
      }
    } else {
      XIcon = IconSettings;
    }

    return (
      XIcon ? (
        <Box style={{ backgroundColor: rgbaIconColor, padding: '1%', borderRadius: '7px' }}>
          <XIcon size={32} color={color} />
        </Box>
      ) : (
          <div>Icon: {name} not found</div>
      )
    );
  };

  const filteredMod = mod.filter((m: ModType) =>
    (m.xTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.xDescription?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    ((m.xTags || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.xAuthor?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Flex direction="column">
        <Box mb={theme.spacing.md}>
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.currentTarget.value?.toString() || '')}
            style={{width:'100%'}}
          />
        </Box>
        <ScrollArea h={420} style={{width: '100%'}}>
          <List
            spacing="xs"
            size="sm"
            center
          >
            {filteredMod.map((mod, index) => (
              <List.Item
                key={index}
                icon={renderIcon(mod.xIcon, mod.iconColor)}
                onClick={() => selectItem(mod)}
              >
                <div>
                  <Text>{mod.xTitle}</Text>
                  <Text size="sm" color="dimmed" weight={400}>
                    {mod.xDescription}
                  </Text>
                </div>
              </List.Item>
            ))}
          </List>
        </ScrollArea>
      </Flex>
    </>
  );
}

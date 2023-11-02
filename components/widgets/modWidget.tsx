import { useEffect, useState } from 'react';
import { Text, Modal, Box, Title, Paper, Input, useMantineTheme, List, Flex, ScrollArea } from "@mantine/core";
import icons, { IconNames } from '../icons/icons';
import { IconSettings } from '@tabler/icons-react';
import { lighten } from 'polished';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Cookies from 'js-cookie';
import { sampleMods } from './starterpacks/starterpack1';

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
  const [modStatuses, setModStatuses] = useState<{ [key: string]: { status: string, text: string } }>({});

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

  const [isNewUser, setIsNewUser] = useState(false);

  const getModsForCategory = (startIndex: number) => {
    return sampleMods.slice(startIndex, startIndex + 5);
  };

  const categories = [
    {
      title: 'History',
      icon: 'buildingFortress',
      color: '#A89C91',
      mods: getModsForCategory(0)
    },
    {
      title: 'Business',
      icon: 'presentation',
      color: '#001F3F',
      mods: getModsForCategory(5)
    },
    {
      title: 'Science',
      icon: 'dna',
      color: '#4CAF50',
      mods: getModsForCategory(10)
    },
    {
      title: 'Fantasy',
      icon: 'wand',
      color: '#7D4DCC',
      mods: getModsForCategory(15)
    },
    {
      title: 'Sci-fi',
      icon: 'rocket',
      color: '#4DD0E1',
      mods: getModsForCategory(20)
    },
    {
      title: 'Roles',
      icon: 'firetruck',
      color: '#8B0000',
      mods: getModsForCategory(25)
    }
  ];

  useEffect(() => {
    if (!Cookies.get('newuser')) {
      setIsNewUser(true);
    }
  }, []);

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

  const addModToUserCollection = async (targetMod: ModType, category: string) => {
    // Ensure a user is logged in
    if (!user) {
      console.error('User not authenticated.');
      return;
    }

    const { data: userMods, error: fetchError } = await supabaseClient
      .from('user_mods')
      .select('mymods')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error retrieving user mods:', fetchError);
      return;
    }

    const existingMods = userMods.mymods;

    const modExists = existingMods.some(
      (modItem: ModType) => modItem.xTitle === targetMod.xTitle
    );

    if (modExists) {
      setModStatuses(prevStatuses => ({
        ...prevStatuses,
        [targetMod.xTitle]: { status: 'exists', text: 'Already added!' }
      }));
      return;
    }

    // Add the new mod to the user's collection
    const updatedModList = [...existingMods, targetMod];
    const { error: updateError } = await supabaseClient
      .from('user_mods')
      .update({ mymods: updatedModList })
      .eq('user_id', userId);

    // Handle update results
    if (updateError) {
      console.error('Error updating mods:', updateError);
    } else {
      setModStatuses(prevStatuses => ({
        ...prevStatuses,
        [targetMod.xTitle]: { status: 'added', text: 'Added' }
      }));
    }
  };

  const renderStarterPackIcon = (name: string, color: string | undefined) => {
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

    return {
      iconComponent: (
        XIcon ? (
          <Box style={{ backgroundColor: rgbaIconColor }}>
            <XIcon size={48} color={color} />
          </Box>
        ) : (
          <div>Icon: {name} not found</div>
        )
      ),
      backgroundColor: rgbaIconColor,
      color: color
    };
  };

  const handlePaperClick = async (selectedMods: any, category: string) => {
      Cookies.set('newuser', 'false', { expires: 600 });
      setIsNewUser(false);

      for (const mod of selectedMods) {
          await addModToUserCollection(mod, category);
      }

      window.location.reload();
  };

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
      <Modal
        withCloseButton={false}
        opened={isNewUser}
        onClose={() => setIsNewUser(false)}
        title="Welcome"
        size="lg"
      >
        <Flex direction="column" align="center" style={{ gap: '20px' }}>
          <Title order={2}>Choose a Starter Pack</Title>
          <Text align="center">
            We saw you didn&apos;t have many mods yet, so feel free to choose a starter pack!
          </Text>
          <Flex wrap="wrap" justify="center" style={{ gap: '20px', width: '100%' }}>
            {categories.map((category, index) => {
              const renderedIcon = renderStarterPackIcon(category.icon, category.color);

              return (
                <Flex key={index} direction="column" style={{ gap: '10px', flex: '1 1 calc(50% - 10px)', maxWidth: 'calc(50% - 10px)' }}>
                  <Paper
                    shadow="sm"
                    style={{ height: '150px', background: renderedIcon.backgroundColor, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onClick={() => handlePaperClick(category.mods, category.title)}
                  >
                    <Flex direction="column" align="center" justify="center">
                      <Paper
                        style={{
                          height: '100px',
                          width: '100px',
                          cursor: 'pointer',
                          background: renderedIcon.backgroundColor,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {renderedIcon.iconComponent}
                      </Paper>
                      <Text style={{color:renderedIcon.color}}>{category.title}</Text>
                    </Flex>
                  </Paper>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}

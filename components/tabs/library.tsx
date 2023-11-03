import { useEffect, useState } from 'react';
import { Text, Box, Group, Accordion, Card, Image, Modal, createStyles, Progress, useMantineTheme, Flex, Grid, Button, ScrollArea, ActionIcon, Badge, Select } from "@mantine/core";
import icons, { IconNames } from '../icons/icons';
import { lighten } from 'polished';
import  { IconSettings, IconCheck, IconCloudShare, IconFlask, IconArrowBack, IconDownload } from "@tabler/icons-react";
import { useSearch } from '../../context/SearchContext';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useActiveComponent } from '../../context/NavContext';
import { useSelectedItem } from '../../context/SettingsContext';
import { useConfig } from '../../context/ConfigContext';
import { useMessages } from '../../context/MessageContext';

interface Mod {
  xTitle: string;
  xDescription: string;
  xProduct: string;
  xType: string;
  xShowImpressionLevels?: string;
  xImpressionLevelRed?: string;
  xImpressionLevelGreen?: string;
  xShowEmotionalState?: string;
  xPrompt: string;
  xIcon: string;
  iconColor: string;
  xAuthor: string;
  xTags?: string[];
}


const useStyles = createStyles((theme) => ({
  control: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    fontSize: theme.fontSizes.sm,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
  },
}));

export default function Library() {
  const [mod, setMod] = useState<Mod[]>([]);
  const { setActiveComponent, charSwitch, setCharSwitch } = useActiveComponent();
  const { setSelectedItem } = useSelectedItem();
  const { setNewConvo } = useMessages();
  const { sparkConfig } = useConfig();
  const [modStatuses, setModStatuses] = useState<{ [key: string]: { status: string, text: string } }>({});
  const [sortMod, setSortMod] = useState('Oldest');
  const [sortedMod, setSortedMod] = useState([...mod]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isNotPremium, setIsNotPremium] = useState(false);
  const itemsPerPage = 10;
  const { classes } = useStyles();
  const { searchTerm } = useSearch();
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const userId = user?.id;
  const supabaseClient = useSupabaseClient();
  const tableColor = theme.colorScheme === 'dark' ? '#202125' : 'rgba(170,170,170,0.15)';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/get-mod');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        let data = await res.json();
        if (data[0]?.SGPT) {
          data = data[0].SGPT;

          if (sortMod === 'A-Z') {
            data.sort((a: {xTitle: string}, b: {xTitle: string}) => {
              const aTitle = a.xTitle.toLowerCase();
              const bTitle = b.xTitle.toLowerCase();
              if (aTitle < bTitle) return -1;
              if (aTitle > bTitle) return 1;
              return 0;
            });
          } else if (sortMod === 'Z-A') {
              data.sort((a: {xTitle: string}, b: {xTitle: string}) => {
                const aTitle = a.xTitle.toLowerCase();
                const bTitle = b.xTitle.toLowerCase();
                if (aTitle < bTitle) return 1;
                if (aTitle > bTitle) return -1;
                return 0;
              });
            } else if (sortMod === 'Latest') {
            data.reverse();
          }
          setMod(data);
          setSortedMod([...data]);
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [sortMod]);

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

  const copyModToMyMods = async (mod: Mod) => {
    if (!user) {
      console.error('No user is logged in.');
      return;
    }

    const { data: currentMods, error } = await supabaseClient
      .from('user_mods')
      .select('mymods')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch mods:', error);
      return;
    }

    const modsArray = currentMods.mymods;
    if (modsArray.some((currentMod: Mod) => currentMod.xTitle === mod.xTitle)) {
      setModStatuses(prevStatuses => ({
        ...prevStatuses,
        [mod.xTitle]: { status: 'exists', text: 'Already added!' }
      }));
      return;
    }

    if (modsArray.length >= 10) {
      const { data: subscriptions } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);

      const { data: customers } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('user_id', userId);

      if ((!subscriptions || subscriptions.length === 0) && (!customers || customers.length === 0)) {
        if (!sparkConfig?.subscription.isSubscriptionOn) {
          return;
        } else {
          setIsNotPremium(true);
        }
        return;
      }
    }

    const updatedModsArray = [...modsArray, mod];

    const { error: updateError } = await supabaseClient
      .from('user_mods')
      .update({ mymods: updatedModsArray })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update mods:', updateError);
    } else {
      setModStatuses(prevStatuses => ({
        ...prevStatuses,
        [mod.xTitle]: { status: 'added', text: 'Added' }
      }));
    }
  };


      const filteredMod = mod.filter(m =>
        (m.xTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.xDescription?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        ((m.xTags || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.xAuthor?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

      const getPageData = (data: Mod[], currentPage: number, itemsPerPage: number): Mod[] => {
        const offset = (currentPage - 1) * itemsPerPage;
        return data.slice(offset, offset + itemsPerPage);
      }

      const nextPage = () => {
        setCurrentPage((prev) => prev + 1);
      }

      const prevPage = () => {
        setCurrentPage((prev) => prev - 1);
      }

      // const firstPage = () => {
      //   setCurrentPage(1);
      // }

      const lastPage = () => {
        setCurrentPage(Math.ceil(filteredMod.length / itemsPerPage));
      }

      const currentPageMod = getPageData(filteredMod, currentPage, itemsPerPage);

      const prevPageNumber = Math.max(1, currentPage - 1);
      const nextPageNumber = Math.min(Math.ceil(filteredMod.length / itemsPerPage), currentPage + 1);
      const lastPageNumber = Math.ceil(filteredMod.length / itemsPerPage);

      const handleSortChange = (value: string) => {
        setSortMod(value);
      };

      useEffect(() => {
        setCurrentPage(1);
      }, [searchTerm]);

      async function handleCloudPlay(mod: Mod) {
        if (!user) {
          console.error('No user is logged in.');
          return;
        }

          const { data: subscriptions } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId);

          const { data: customers } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('user_id', userId);

          if ((!subscriptions || subscriptions.length === 0) && (!customers || customers.length === 0)) {
            if (!sparkConfig?.subscription.isSubscriptionOn) {
              return;
            } else {
              setIsNotPremium(true);
            }
            return;
          }
        setCharSwitch(true);
        setNewConvo(true);
        setSelectedItem(mod);
        setActiveComponent('Companions');
      }


  return (
    <>
    {loading ? (
      <Flex direction="column" justify="center" align="center" style={{marginTop:'22.5vh',padding:'100px'}}>
          <Progress value={100} style={{ width: '50%'}} animate />
      </Flex>
    ) : (
    <Box style={{top:'15%', height:'100%', width:'100%', margin:'0 auto', display:'block'}}>
    <Select
      data={['Oldest', 'Latest', 'A-Z', 'Z-A']}
      value={sortMod}
      onChange={handleSortChange}
      placeholder="Sort by..."
    />
    <ScrollArea h="64vh" w="100%">
    <Grid gutter="xs" justify="center" style={{width:'100%', paddingTop:'2vh'}}>
    {currentPageMod.map((mod, index) => (
      <Grid.Col span={12} key={index}>
        <Accordion chevronPosition="right" variant="contained">
          <Accordion.Item value={mod.xTitle}>
            <Accordion.Control className={classes.control}>
              <Group noWrap>
                {renderIcon(mod.xIcon, mod.iconColor)}
                <div>
                  <Text>{mod.xTitle}</Text>
                  <Text size="sm" color="dimmed" weight={400}>
                    {mod.xDescription}
                  </Text>
                </div>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
            <Grid gutter="0" style={{border:'1px solid rgba(160,160,160,0.08)', borderRadius:'7px'}}>
              <Grid.Col span={6}>
              <Flex direction="column" style={{height: '100%'}}>
                <Box style={{padding: '10px'}}>
                  <Text size="sm"><strong>Author</strong></Text>
                </Box>
                <Box style={{backgroundColor: tableColor, padding: '10px', height:'100%'}}>
                  <Text size="sm"><strong>Tags</strong></Text>
                </Box>
              </Flex>
                </Grid.Col>
                <Grid.Col span={6}>
                <Flex direction="column" style={{height: '100%'}}>
                  <Box style={{padding: '10px'}}>
                    <Text size="sm">{mod.xAuthor}</Text>
                  </Box>
                  <Box style={{backgroundColor: tableColor, padding: '10px'}}>
                    {mod.xTags && Array.isArray(mod.xTags) && mod.xTags.slice(0, 3).map((tag) => (
                      <Badge color="teal" key={tag}>{tag}</Badge>
                    ))}
                  </Box>
                </Flex>
                </Grid.Col>
              </Grid>
              <Flex mt="2vh">
              {
                !sparkConfig?.main.cloudPlayOnly && (
                  <Button
                    onClick={() => copyModToMyMods(mod)}
                    rightIcon={<IconDownload/>}
                    style={{
                      backgroundColor: modStatuses[mod.xTitle]?.status === 'exists' ? 'red' :
                        modStatuses[mod.xTitle]?.status === 'added' ? 'green' : undefined,
                      color: 'white'
                    }}
                  >
                    {modStatuses[mod.xTitle]?.text || 'Download'}
                    {modStatuses[mod.xTitle]?.status === 'added' && <IconCheck />}
                  </Button>
                )
              }
              <Button
                onClick={() => handleCloudPlay(mod)}
                rightIcon={<IconCloudShare/>}
                color="teal"
                style={{marginLeft:'7px'}}
              >
                Cloud play
              </Button>
              </Flex>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        </Grid.Col>
      ))}
      </Grid>
      </ScrollArea>
      <Box style={{float:'left', left:0, marginTop:'2.5vh'}}>
      <Flex>
        <ActionIcon
          onClick={() => setActiveComponent('Companions')}
          aria-label="SparkGPT"
          size="md"
          variant="default"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px'}}
        >
        <IconArrowBack size="2rem"/>
        </ActionIcon>
        <ActionIcon
          onClick={() => setActiveComponent('Laboratory')}
          aria-label="Laboratory"
          size="md"
          variant="default"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px'}}
        >
        <IconFlask size="2rem"/>
        </ActionIcon>
        <Badge radius="xs">
            <Flex><Text>{filteredMod.length}</Text><Text style={{marginLeft:'4.2px'}}>results</Text></Flex>
        </Badge>
      </Flex>
      </Box>
      <Box style={{marginTop:'2.5vh', float:'right', right:0}}>
      <Flex direction="row">
          <Button style={{marginLeft:'1vw', marginRight:'1vw'}} disabled={currentPage === 1} onClick={prevPage}>{prevPageNumber}</Button>
          <Text style={{fontWeight:'bold', transform:'translateY(2.1vh)'}}>...</Text>
          <Button style={{marginLeft:'1vw'}} disabled={currentPage === lastPageNumber} onClick={nextPage}>{nextPageNumber}</Button>
          <Button style={{marginLeft:'1vw'}} onClick={lastPage}>Last</Button>
      </Flex>
      </Box>
    </Box>
  )}
  <Modal
    withCloseButton={false}
    opened={isNotPremium}
    onClose={() => setIsNotPremium(false)}
    title=""
    size="xs"
  >
    <Flex direction="column" align="center" style={{ gap: '20px' }}>
      <Card.Section>
        <Image
          style={{borderRadius:'6px'}}
          src="/spark-membership-banner.png"
          height={160}
          alt="Spark Membership"
        />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text weight={500}>Premium Membership</Text>
        <Badge color="green" variant="light">
          $4/week!
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" align="center">
        Join us as a member for unlimited access and to support new innovations.
      </Text>

      <Flex style={{ gap: '15px', marginTop:'7px' }} justify="center">
        <Button onClick={() => setIsNotPremium(false)} variant="outline">No thanks</Button>
        <a href="https://spark.study/membership" style={{ textDecoration: 'none' }}>
          <Button color="green">
            Get Spark Pass!
          </Button>
        </a>
      </Flex>
    </Flex>
  </Modal>
    </>
  );
}

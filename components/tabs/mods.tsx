import { useState, useEffect } from 'react';
import icons, { IconNames } from '../icons/icons';
import { lighten } from 'polished';
import {
  Text,
  TransferListData,
  Box,
  Button,
  Flex,
  useMantineTheme,
} from '@mantine/core';
import {
  MantineReactTable,
  useMantineReactTable,
  MRT_ColumnDef,
} from 'mantine-react-table';
import { IconClipboard, IconPalette, IconCheck, IconFilePlus, IconFileMinus } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import Cookies from 'js-cookie'; // import Cookies from js-cookie
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface Mod {
  id: string;
  selected: boolean;
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
  value: string;
}
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

const RenderIcon: React.FC<{name: string, color?: string}> = ({name, color}) => {
  const isIconMobile = useMediaQuery('(max-width: 767px)');
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
  }

  return (
    XIcon ? (
      <Box style={{
        backgroundColor: rgbaIconColor,
        padding: '1%',
        paddingTop: '0.5vh',
        paddingLeft: isIconMobile ? '1vw' : '0.33vw',
        paddingRight: isIconMobile ? '1vw' : '0.33vw',
        borderRadius: '7px'
      }}>
        <XIcon size={32} color={color} style={{transform:'translateY(0.2vh)'}}/>
      </Box>
    ) : (
      <div>Icon: {name} not found</div>
    )
  );
};



const RenderIcon2: React.FC<{name: string}> = ({name}) => {
  const isIconMobile = useMediaQuery('(max-width: 767px)');
  let XIcon: any = null;
  if (name in icons) {
    const iconName = name as IconNames;
    XIcon = icons[iconName];
  }
  return (
    XIcon ? (
      <Box style={{
        padding: '1%',
        paddingTop: '0.5vh',
        paddingLeft: isIconMobile ? '1vw' : '0.33vw',
        paddingRight: isIconMobile ? '1vw' : '0.33vw',
        borderRadius: '7px'
      }}>
        <XIcon size={32} style={{transform:'translateY(0.2vh)'}}/>
      </Box>
    ) : (
      <div>Icon: {name} not found</div>
    )
  );
};

export default function MyMods() {
  const [myMods, setMyMods] = useState<Mod[]>([]);
  const [modPack, setModPack] = useState<Mod[]>([]);
  const [activeModTab, setActiveModTab] = useState('Downloads'); // Add this line
  const [roomCode, setRoomCode] = useState<string>('');
  const [stagedTransferListData, setStagedTransferListData] = useState<TransferListData>([[], []]);
  const supabaseClient = useSupabaseClient();
  const [colorToggleState, setColorToggleState] = useState(false);
  const user = useUser();
  const userId = user?.id;
  const [isDataFetched, setIsDataFetched] = useState(false);
  const theme = useMantineTheme();

  const fetchMyMods = async () => {
    try {
      const { data: fetchedData, error } = await supabaseClient
        .from('user_mods')
        .select('mymods, mymodpack')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      const { mymods, mymodpack } = fetchedData;
      const formattedMyMods = mymods.map((mod: Mod) => ({
        xTitle: mod.xTitle,
        xDescription: mod.xDescription,
        xIcon: mod.xIcon,
        iconColor: mod.iconColor,
        xProduct: mod.xProduct,
        xType: mod.xType,
        xShowImpressionLevels: mod.xShowImpressionLevels,
        xImpressionLevelRed: mod.xImpressionLevelRed,
        xImpressionLevelGreen: mod.xImpressionLevelGreen,
        xShowEmotionalState: mod.xShowEmotionalState,
        xPrompt: mod.xPrompt,
        xAuthor: mod.xAuthor,
        xTags: mod.xTags,
      }));
      const formattedModPack = mymodpack.map((mod: Mod) => ({
        xTitle: mod.xTitle,
        xDescription: mod.xDescription,
        xIcon: mod.xIcon,
        iconColor: mod.iconColor,
        xProduct: mod.xProduct,
        xType: mod.xType,
        xShowImpressionLevels: mod.xShowImpressionLevels,
        xImpressionLevelRed: mod.xImpressionLevelRed,
        xImpressionLevelGreen: mod.xImpressionLevelGreen,
        xShowEmotionalState: mod.xShowEmotionalState,
        xPrompt: mod.xPrompt,
        xAuthor: mod.xAuthor,
        xTags: mod.xTags,
      }));
      setMyMods(formattedMyMods);
      setModPack(formattedModPack);
      setStagedTransferListData([formattedMyMods, formattedModPack]);
      setIsDataFetched(true);
    } catch (error) {
      console.error('An error occurred while fetching the mods:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyMods();
    } else if (!userId) {
    window.location.href = `${process.env.SITE_URL}/auth/signin`;
    }
  }, [userId, supabaseClient]);

  const generateRoomCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let roomCode = '';
    do {
      roomCode =
        characters[Math.floor(Math.random() * characters.length)] +
        characters[Math.floor(Math.random() * characters.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        numbers[Math.floor(Math.random() * numbers.length)];
      const { count } = await supabaseClient
        .from('user_mods')
        .select('*', { count: 'exact' })
        .eq('roomcode', roomCode);
      if (count === 0) {
        return roomCode;
      }
    } while (true);
  };
  useEffect(() => {
    const fetchRoomCode = async () => {
      try {
        let roomCode = '';
        const { data: existingRoomCode } = await supabaseClient
          .from('user_mods')
          .select('roomcode')
          .eq('user_id', userId)
          .single();
        if (existingRoomCode?.roomcode) {
          roomCode = existingRoomCode.roomcode;
        } else {
          roomCode = await generateRoomCode();
          await supabaseClient
            .from('user_mods')
            .update({ roomcode: roomCode })
            .eq('user_id', userId);
        }
        setRoomCode(roomCode);
      } catch (error) {
        console.error('An error occurred while updating the mods:', error);
        setRoomCode('');
      }
    }

    fetchRoomCode();

  }, []);  // if you want this to run once when the component mounts

const [copySuccess, setCopySuccess] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [copySuccess]);

  const columns: MRT_ColumnDef<Mod>[] = [
    {
      accessorKey: 'xIcon',
      header: '',
      size: 100,
      Cell: ({ cell }) => (
        <>
        {colorToggleState ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RenderIcon2 name={String(cell.getValue())} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RenderIcon name={String(cell.getValue())} color={cell.row.original.iconColor} />
          </Box>
        )}
        </>
      ),
    },
    {
      accessorKey: 'xTitle',
      header: 'Title',
      size: 250,
      Cell: ({ cell }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text>{String(cell.getValue())}</Text>
        </Box>
      ),
    },
  ];

  const handleTransferToTable2 = async () => {
    try {
      // Get the selected row indices
      const selectedRowIndices = Object.entries(table1.getState().rowSelection)
        .filter(([isSelected]) => isSelected)
        .map(([index]) => Number(index));
      const updatedModPack = [...modPack];
      let updatedMyMods = [...myMods];
      // Add selected mods to ModPack and remove from MyMods
      selectedRowIndices.forEach((index) => {
        const modToMove = myMods[index];
        console.log(modToMove);
        if (modToMove) {
          updatedModPack.push(modToMove);
        }
      });
      updatedMyMods = myMods.filter((mod, index) => !selectedRowIndices.includes(index));
      const { error } = await supabaseClient
        .from('user_mods')
        .update({ mymodpack: updatedModPack })
        .eq('user_id', userId);
      if (error) throw error;
      setModPack(updatedModPack);
      setMyMods(updatedMyMods); // Update myMods state
      table1.resetRowSelection(true); // Deselect all rows in table 1
      table2.resetRowSelection(true); // Deselect all rows in table 1
    } catch (error) {
      console.error('An error occurred while transferring mods:', error);
    }
  };
  const handleDeleteFromTable2 = async () => {
    try {
      // Get the selected row indices
      const selectedRowIndices = Object.entries(table2.getState().rowSelection)
        .filter(([isSelected]) => isSelected)
        .map(([index]) => Number(index));
      let updatedModPack = [...modPack];
      // Remove selected mods from ModPack
      updatedModPack = modPack.filter((mod, index) => !selectedRowIndices.includes(index));
      const { error } = await supabaseClient
        .from('user_mods')
        .update({ mymodpack: updatedModPack })
        .eq('user_id', userId);
      if (error) throw error;
      setModPack(updatedModPack);
      table1.resetRowSelection(true); // Deselect all rows in table 1
      table2.resetRowSelection(true); // Deselect all rows in table 2
    } catch (error) {
      console.error('An error occurred while deleting mods:', error);
    }
  };
  // Table 1 (My Mods)
  const table1 = useMantineReactTable<Mod>({
    columns,
    data: myMods,
    initialState: { showColumnFilters: false },
    rowCount: 5,
    paginationDisplayMode: 'pages',
    enableRowActions: false,
    enableRowSelection: true,
    enableColumnOrdering: false,
    enableColumnFilterModes: false,
    enableColumnFilters: false,
    enablePinning: false,
    renderTopToolbarCustomActions: () => {
      return (
        <>
        <Button
        color="green"
        variant="outline"
        leftIcon={<IconFilePlus size="0.9rem" />}
        disabled={!table1.getIsSomeRowsSelected()}
        onClick={handleTransferToTable2}>Add to room</Button>
        </>
      );
     },
  });

  const table2 = useMantineReactTable<Mod>({
    columns,
    data: modPack,
    initialState: { showColumnFilters: false },
    rowCount: 5,
    paginationDisplayMode: 'pages',
    enableRowActions: false,
    enableRowSelection: true,
    enableColumnOrdering: false,
    enableColumnFilters: false,
    enableColumnFilterModes: false,
    enablePinning: false,
    renderTopToolbarCustomActions: () => {
      return (
        <>
        <Button
        color="red"
        variant="outline"
        leftIcon={<IconFileMinus size="0.9rem" />}
        disabled={!table2.getIsSomeRowsSelected()}
        onClick={handleDeleteFromTable2}
        >
        Remove
        </Button>
        </>
      );
     },
  });

  const redirectToChat = async () => {
      const { data: fetchedData } = await supabaseClient
          .from('user_mods')
          .select('mymods, mymodpack')
          .eq('user_id', userId)
          .single();

      if (fetchedData?.mymods) {
          // Clear all existing mymods cookies
          const cookieKeys = Object.keys(Cookies.get());
          for (const key of cookieKeys) {
              if (key.startsWith('mymods')) {
                  Cookies.remove(key, { domain: '.spark.study', path: '/', sameSite: 'lax' });
              }
          }

          // Split the fetched mymods into chunks and set each chunk as a separate cookie
          const chunks = Math.ceil(fetchedData.mymods.length / 3);
          for (let i = 0; i < chunks; i++) {
              const start = i * 3;
              const end = start + 3;
              const chunk = fetchedData.mymods.slice(start, end);
              Cookies.set(`mymods${i+1}`, JSON.stringify(chunk), { domain: '.spark.study', path: '/', sameSite: 'lax' });
          }
      }

      setTimeout(() => window.location.href = process.env.SITE_URL || "", 500);
  };

  return (
  <Box w="100%">
  <div>
  <Flex>
    <Button
      variant="subtle"
      style={{ backgroundColor: `${activeModTab === 'Downloads' ? (theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.white) : ''}`, border: `1px solid ${activeModTab === 'Downloads' ? 'rgba(165,165,165,0.4)' : 'rgba(165,165,165,0)'}`,borderBottom:'0px', borderBottomLeftRadius:"0px", borderBottomRightRadius: "0px"}}
      onClick={() => setActiveModTab('Downloads')}>
      Downloads
    </Button>
    <Button
      variant="subtle"
      style={{ backgroundColor: `${activeModTab === 'Shared' ? (theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.white) : ''}`, border: `1px solid ${activeModTab === 'Shared' ? 'rgba(165,165,165,0.4)' : 'rgba(165,165,165,0)'}`,  borderBottom:'0px', borderBottomLeftRadius:"0px", borderBottomRightRadius:"0px"}}
      onClick={() => setActiveModTab('Shared')}>
      Shared Room
    </Button>
    <Button variant="subtle" color="grey" onClick={() => setColorToggleState(!colorToggleState)}
      style={{opacity: colorToggleState ? 1 : 0.7, transform:'translateY(0vh)', padding:'0px', paddingLeft:'1vw',paddingRight:'1vw', borderBottomLeftRadius:"0px", borderBottomRightRadius:"0px", borderBottom:'0px',  border: '1px solid rgba(165,165,165,0.4)', backgroundColor:theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.white}}
    >
      <IconPalette size={25} />
    </Button>
    <Button
      onClick={redirectToChat}
      variant="gradient"
      gradient={{ from: 'indigo', to: 'cyan' }}
      style={{color:'white', float:'right', right:0, borderBottomLeftRadius:"0px", borderBottomRightRadius:"0px"}}
    >
      Use mods!
    </Button>
    </Flex>
  </div>
  <>
      {activeModTab === 'Downloads' && (
        <div style={{height: "200%"}}>
          <MantineReactTable table={table1} />
        </div>
      )}
      {activeModTab === 'Shared' && (
        <div>
          <MantineReactTable table={table2} />
          {roomCode && (
            <>
    <Flex direction="row" style={{marginTop:'3vh'}}>
                <Text size="lg" weight={500}>
              Room Code: {roomCode}
            </Text>
            <Button style={{transform:'translateY(-0.8vh)'}} variant="subtle" onClick={copyToClipboard} rightIcon={copySuccess ? <IconCheck /> : <IconClipboard />}>
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
    </Flex>
                <Text style={{opacity:'0.7', marginTop:'3vh'}}>
                Send your code to friends, employees or students to share with them the mods that are in your Mod Pack. Want to join a room? Go to the Join Room tab and enter your code!
                </Text>
            </>
          )}
        </div>
      )}
      </>
    </Box>
  );
}

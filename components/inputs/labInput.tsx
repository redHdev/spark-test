import { Input, Badge, Image, List, Card, Group, Flex, Divider, Button, Text, Title, Box, ActionIcon, Modal, Textarea, ColorInput } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconBrandInstagram, IconBrandTwitter, IconBrandDiscord, IconRobot, IconX, IconArrowBack, IconAlertCircle, IconBook } from '@tabler/icons-react';
import {
  IconFlask,
  IconCube,
  IconPyramid,
  IconHexagonalPyramid,
  IconPrism,
  IconHexagonalPrism,
  IconCylinder
} from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import styled, { keyframes } from 'styled-components';
import { useMantineTheme } from '@mantine/core';
import icons, { IconNames } from '../icons/icons';
import { bannedKeywords } from './bannedKeywords';
import { lighten } from 'polished';
import { useActiveComponent } from '../../context/NavContext';
import { useConfig } from '../../context/ConfigContext';

const iconsArray = [
  IconFlask,
  IconCube,
  IconPyramid,
  IconHexagonalPyramid,
  IconPrism,
  IconHexagonalPrism,
  IconCylinder
];

function LabInput() {
  const [opened, { open, close }] = useDisclosure(false);
  const supabaseClient = useSupabaseClient();
  const { setActiveComponent, setOpenLab } = useActiveComponent();
  const { sparkConfig } = useConfig();
  const user = useUser();
  const userId = user?.id;
  const isMobile = useMediaQuery("(max-width: 50em)");
  const theme = useMantineTheme();
  const [modRoomCode, setModRoomCode] = useState<string>('');
  const [openModalSuccess, setOpenModalSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentIcon, setCurrentIcon] = useState(0);
  const [showBannedWordsModal, setShowBannedWordsModal] = useState(false);
  const [modalAction, setModalAction] = useState<'addToMyMods' | 'uploadToLibrary' | null>(null);
  const messages = [
    "Sending input to servers...",
    "Initializing Spark AI...",
    "Writing prompt and info...",
    "Assigning icon and colors...",
    "Building mod...",
    "Done!"
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [isFetching, setIsFetching] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModRoomCode(e.target.value);
  }

  const fetchRoomCode = async () => {
    callOpenAI(modRoomCode);
  }

  const [parsedData, setParsedData] = useState<{
    xTitle: string;
    xDescription: string;
    xPrompt: string;
    xAuthor: string;
    xIcon: string;
    iconColor: string;
    xTags?: string[];
  }>({
    xTitle: '',
    xDescription: '',
    xPrompt: '',
    xAuthor: '',
    xIcon: '',
    iconColor: '',
    xTags: []
  });

  const fetchIconFromAPI = async (theme: string): Promise<string> => {
    try {
      const response = await fetch('/api/icon-setter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: theme })
      });

      if (!response.ok) {
        throw new Error('Failed to get icon from OpenAI');
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to fetch icon:', error);
      return '';
    }
  };

  const [isNotPremium, setIsNotPremium] = useState(false);

  const callOpenAI = async (prompt: string) => {
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

    setIsFetching(true);
    setCurrentMessageIndex(0);
    try {
      const response = await fetch('/api/mod-maker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const moddData = await response.text();
      const jsonData = JSON.parse(moddData);

      const { data: { user }, error } = await supabaseClient.auth.getUser();
      let fullName;
      if (error || !user) {
        console.error("Failed to fetch user:", error);
        fullName = "Anonymous";
      } else {
        fullName = user?.user_metadata?.full_name;
        if (!fullName) {
          fullName = "Anonymous";
        }
      }
      jsonData.xAuthor = fullName;

      setParsedData(jsonData);

      let iconFromAPI = '';
      const availableIconNames = Object.keys(icons);
      const maxAttempts = 3;
      for(let i = 0; i < maxAttempts; i++) {
        iconFromAPI = await fetchIconFromAPI(prompt);
        console.log(iconFromAPI);
        if (availableIconNames.includes(iconFromAPI)) {
          break;
        }
      }

      if (!availableIconNames.includes(iconFromAPI)) {
        jsonData.xIcon = "apple";
      } else {
        jsonData.xIcon = iconFromAPI;
      }

      setParsedData(jsonData);
      setCurrentMessageIndex(5);
      open();
      setIsFetching(false);
      setModRoomCode("");
      return moddData;
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

useEffect(() => {
  if (isFetching && currentMessageIndex < messages.length - 1) {
    const timer = setTimeout(() => {
      setCurrentMessageIndex(prevIndex => prevIndex + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [isFetching, currentMessageIndex]);

  useEffect(() => {
    // Store the original overflow values
    const originalOverflowY = window.getComputedStyle(document.body).overflowY;
    const originalOverflowX = window.getComputedStyle(document.body).overflowX;

    // Disable scroll on both axes
    document.body.style.overflowY = 'hidden';
    document.body.style.overflowX = 'hidden';

    // Re-enable scroll on unmount
    return () => {
      document.body.style.overflowY = originalOverflowY;
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);


  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
      fetchRoomCode();
    }
  }

  const containsBannedKeywords = (text: string) => {
    for (const keyword of bannedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        return true;
      }
    }
    return false;
  };

  const checkForBannedWords = () => {
    return containsBannedKeywords(parsedData.xPrompt) ||
           containsBannedKeywords(parsedData.xDescription) ||
           containsBannedKeywords(parsedData.xTags ? parsedData.xTags.join(' ') : '') ||
           containsBannedKeywords(parsedData.xTitle);
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
      XIcon = IconAlertCircle;
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

  const uploadToLibrary = async () => {
    if (!user) {
      console.error('No user is logged in.');
      return;
    }
    if (checkForBannedWords()) {
      console.error('Content contains banned keywords.');
      setShowBannedWordsModal(true);
      return;
    }
    try {
      // 1. Fetch the SGPT data from the library table
      const { data: libraryData, error: fetchError } = await supabaseClient
      .from('library')
      .select('SGPT');

      if (fetchError || !libraryData || libraryData.length === 0) {
          console.error('Failed to fetch SGPT from library:', fetchError);
          return;
      }

      const updatedSGPTArray = libraryData[0]?.SGPT || [];
      const updatedModsArray = [...updatedSGPTArray, parsedData];

      const { error: updateError } = await supabaseClient
          .from('library')
          .update({ SGPT: updatedModsArray })
          .eq('id', 1);

      if (updateError) {
        throw new Error('Failed to update SGPT in library');
        close();
      }
      const { data: currentMods, error } = await supabaseClient
      .from('user_mods')
      .select('mymods')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Failed to fetch user mods');
    }

    const modsArray = currentMods?.mymods || [];
    const updatedMyModsArray = [...modsArray, parsedData];

    const { error: modUpdateError } = await supabaseClient
      .from('user_mods')
      .update({ mymods: updatedMyModsArray })
      .eq('user_id', userId);

    if (modUpdateError) {
      throw new Error('Failed to update user mods');
    }
      setModalAction('uploadToLibrary');
      setSuccessMessage("Thanks for contributing to our library! Your mod has also been added to your downloads and feel free to join our Discord if you'd like to connect with fellow modders. Happy modding! ");
      close();
      setOpenModalSuccess(true);

    } catch (error) {
      console.error('An error occurred:', error);
      close();
    }
  };


  const addToMyMods = async () => {
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

    const modsArray = currentMods.mymods || [];  // Handle if it's null/undefined

    const updatedModsArray = [...modsArray, parsedData];  // parsedData contains the new mod

    // Update the user_mods table with the new array of mods
    const { error: updateError } = await supabaseClient
      .from('user_mods')
      .update({ mymods: updatedModsArray })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update mods:', updateError);
      close();
    } else {
      setModalAction('addToMyMods');
      setSuccessMessage("You have added your creation to My Mods. Go check it out and have fun!");
      close();
      setShowBannedWordsModal(false);
      setOpenModalSuccess(true);
    }
  };

  const validateTagLength = (value: string = "") => {
    if (value && (value.length < 2 || value.length > 25)) {
          return "Tag should be above 2 characters!";
      }
      return "";
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % iconsArray.length);
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const CurrentIconComponent = iconsArray[currentIcon];

  return (
    <>
    <Modal opened={openModalSuccess} onClose={() => setOpenModalSuccess(false)}
      transitionProps={{ transition: 'fade', duration: 200 }} centered>
        <Flex align="center" justify="center" direction="column">
            {modalAction === 'addToMyMods' ? <IconRobot size={70}/> : <IconBook size={70}/>}
            <Title>Success</Title>
            <Text style={{marginTop:'2vh'}}>{successMessage}</Text>
            <Flex align="center" justify="center" style={{marginTop: '2vh'}}>
                <ActionIcon component="a" href="https://instagram.com/spark.study" target="_blank" rel="noopener noreferrer">
                    <IconBrandInstagram size={24} />
                </ActionIcon>

                <ActionIcon component="a" href="https://twitter.com/sparkengineai" target="_blank" rel="noopener noreferrer" style={{margin: '0 10px'}}>
                    <IconBrandTwitter size={24} />
                </ActionIcon>

                <ActionIcon component="a" href="https://discord.gg/YQs48nBjz8" target="_blank" rel="noopener noreferrer">
                    <IconBrandDiscord size={24} />
                </ActionIcon>
            </Flex>
        </Flex>
    </Modal>
    <Modal opened={opened} size="70%" onClose={close} title="Edit your mod" fullScreen={isMobile}
        transitionProps={{ transition: 'fade', duration: 200 }} centered>
    <Box style={{ marginTop: '3vh' }}>
    <Flex gap="lg">
    <Box>
    <Flex>
      <Box style={{width:'34px', height:'34px'}}>
      {renderIcon(parsedData.xIcon, parsedData.iconColor)}
      </Box>
      <Box>
      <ColorInput
        value={parsedData.iconColor}
        onChange={(color) => setParsedData((prev) => ({ ...prev, iconColor: color }))}
        style={{ marginLeft: '2vw' }}
        swatchesPerRow={7} format="hex" swatches={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
      />
      </Box>
    </Flex>
    <Flex style={{marginTop:'2vh'}} gap="md" >
    <Box>
      <Text style={{ fontWeight: 'bold' }}>Title</Text>
      <Input
        value={parsedData.xTitle}
        maxLength={20}
        onChange={(e) => setParsedData((prev) => ({ ...prev, xTitle: e.currentTarget.value }))}
        disabled
      />
    </Box>
    <Box>
    <Text style={{ fontWeight: 'bold' }}>Author</Text>
    <Input
      variant="filled"
      value={parsedData.xAuthor}
      disabled
    />
    </Box>
    </Flex>
      <Text style={{ fontWeight: 'bold', marginTop: '2vh' }}>Description</Text>
      <Input
        value={parsedData.xDescription}
        maxLength={45}
        onChange={(e) => setParsedData((prev) => ({ ...prev, xDescription: e.currentTarget.value }))}
        style={{ marginTop: '2vh' }}
        disabled
      />
    </Box>
    <Box style={{width:'100%', height:'100%'}}>
    <Text style={{ fontWeight: 'bold', marginTop: '2vh' }}>Prompt</Text>
    <Textarea
      value={parsedData.xPrompt}
      maxLength={500}
      onChange={(e) => setParsedData((prev) => ({ ...prev, xPrompt: e.currentTarget.value }))}
      style={{ marginTop: '2vh', height:'100%', width:'100%' }}
      autosize
      minRows={6}
      maxRows={6}
      disabled
    />
    </Box>
    </Flex>
    </Box>
    <Text style={{ fontWeight: 'bold', marginTop: '2vh' }}>Tags</Text>
    <Flex direction="row" justify="space-between" style={{ marginTop: '2vh' }}>
    {Array.from({ length: 3 }).map((_, index) => (
        <Input
            key={index}
            maxLength={40}
            value={parsedData.xTags && parsedData.xTags[index] ? parsedData.xTags[index] : ''}
            onChange={(e) => {
                const tags = parsedData.xTags ? [...parsedData.xTags] : [];
                tags[index] = e.currentTarget.value;
                setParsedData((prev) => ({ ...prev, xTags: tags }));
            }}
            style={{ width: '32%' }}
            error={validateTagLength(parsedData.xTags && parsedData.xTags[index] ? parsedData.xTags[index] : '')}
            disabled
        />
    ))}
    </Flex>
    <Flex gap="md" direction={isMobile ? "column" : "row"} style={{ marginTop: '2vh' }}>
    <Button leftIcon={<IconBook size={20} />} color="green" onClick={uploadToLibrary}>Upload to Library</Button>
    <Button leftIcon={<IconRobot size={20} />} onClick={addToMyMods}>Save to My Mods</Button>
    <Button leftIcon={<IconX size={20} />} variant="subtle" color="red" onClick={close}>Discard</Button>
    </Flex>
    </Modal>
    <Flex style={{width:'100%'}} justify="center">
    <img src="general/character_creator.png" alt="Create a character" style={{width:'100%', position:'absolute', left:0,marginTop:'-40.5vh', opacity:'0.082'}}/>

    <Box style={{padding:'0%'}}>
    <Box style={{fontFamily: '"Courier New", Courier, monospace', fontWeight:'bold', zIndex:'1', padding:'6%'}}>
  <Box style={{
      marginTop: '-1vh',
      borderRadius: '5px',
      border: '1px solid rgba(160,160,160,0.3)',
      zIndex: '999',
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.white,
      opacity: '0.86'
  }}>
  <Box style={{
padding: '5.5%'
}}>
        <Title style={{zIndex:'5'}}>Character lab</Title>
        <Flex direction="row" style={{marginTop:'3vh'}}>
        {isFetching ? (
          <>
          <AnimatedIcon>
            <CurrentIconComponent size={20} />
          </AnimatedIcon>
          <Text style={{ marginLeft: '8.5px' }}>{messages[currentMessageIndex]}</Text>
          </>
        ) : (
          <>
          <Input
            placeholder="A character from... that does..."
            onChange={handleChange}
            value={modRoomCode}
            onKeyPress={handleEnterKey}
            w="80%"
            height="17.5vh"
            style={{borderTopRightRadius:'0px', borderBottomRightRadius:'0px'}}
          />
    <ActionIcon color="rgb(70, 130, 180)" radius="xs" size="lg" variant="filled" onClick={fetchRoomCode} style={{borderTopRightRadius:'6px', borderBottomRightRadius:'6px', borderTopLeftRadius:'0px', borderBottomLeftRadius:'0px',  paddingTop:'1px', paddingBottom:'1px', paddingRight:'1px'}}
          >
          <IconFlask size={20}/>
          </ActionIcon>
          </>
        )}
        </Flex>
        </Box>
        <Flex direction="column" gap="sm" style={{marginTop:'-4vh'}}>

          <Text
            w="100%"
            style={{
              marginTop: '4vh',
              borderRadius: '6px',
              zIndex: '5',
              fontWeight: '400',
              padding: '5.5%',
              paddingTop:'0%',
              paddingBottom:'0%'
            }}
            align="left"
          >
            Characters are simple modules that can be made using our own custom character generator.
          </Text>
          <Divider style={{margin: '-0.8rem 0', marginTop:'10px'}}/>
          <Box style={{backgroundColor:'rgba(160,160,160,0.12)', padding:'5.5%'}}>
          <Title size="md">Tips for generating characters:</Title>
          <List>
            <List.Item>
              <Text style={{fontWeight:'400'}}>Give it a name, occupation, background etc.</Text>
            </List.Item>
            <List.Item>
              <Text style={{fontWeight:'400'}}>Describe how it should act and what to say</Text>
            </List.Item>
            <List.Item>
              <Text style={{fontWeight:'400'}}>Anything on the web before Sept. 2023</Text>
            </List.Item>
          </List>
          </Box>
          <Divider style={{margin: '-0.8rem 0'}}/>
          <Flex style={{padding:'5.5%'}}>
          <Button onClick={() => setOpenLab(false)} leftIcon={<IconArrowBack size={20}/>} style={{marginRight:'5px'}} variant="default" aria-label="Go back to laboratory menu">
            Go back
          </Button>
          </Flex>
        </Flex>
</Box>
<Flex style={{bottom:0, left:'15px', transform:isMobile ? 'translateY(30vh)' : 'translateY(16.4vh)'}}>
<ActionIcon
  onClick={() => setActiveComponent('Companions')}
  aria-label="SparkGPT"
  size="md"
  variant="transparent"
  color="white"
  style={{marginLeft:'3px', marginRight:'3px', color:'white'}}
>
<IconArrowBack style={{color:'white'}} size="2rem"/>
</ActionIcon>
<ActionIcon
  onClick={() => setActiveComponent('Library')}
  aria-label="Library"
  size="md"
  variant="transparent"
  color="white"
  style={{marginLeft:'3px', marginRight:'3px', color:'white'}}
>
<IconBook size="2rem" style={{color:'white'}}/>
</ActionIcon>
</Flex>
    </Box>
</Box>
</Flex>
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
<Modal
    opened={showBannedWordsModal}
    onClose={() => setShowBannedWordsModal(false)}
    size="sm"
    transitionProps={{ transition: 'fade', duration: 200 }}
    centered
>
    <Flex align="center" justify="center" direction="column">
        <IconAlertCircle style={{ color: 'red', borderColor: 'red' }} size={70} />
        <Title>Oops!</Title>
        <Text style={{opacity:'0.72'}}>
            We have detected banned words within the mod. You can still download it to My Mods instead of the public library.
        </Text>
        <Button
            style={{marginTop:'2vh'}}
            color="blue"
            onClick={addToMyMods}
        >
            Download to My Mods
        </Button>
    </Flex>
</Modal>
    </>
  );
}

export default LabInput;

const bounceAnimation = keyframes`
0% {
  transform: translate(0);
}
50% {
  transform: translate(0px, 39.0625vh);
}
100% {
  transform: translate(0);
}
`;

const bounceAnimation2 = keyframes`
  0% {
    transform: translate(0);
  }
  50% {
    transform: translate(-21.9619vw, 15.6250vh);
  }
  100% {
    transform: translate(0);
  }
`;

const bounceAnimation3 = keyframes`
0% {
  transform: translate(0);
}
50% {
  transform: translate(10.9810vw, 39.0625vh);
}
100% {
  transform: translate(0);
}
`;

const bounceAnimation4 = keyframes`
0% {
  transform: translate(0);
}
50% {
  transform: translate(23.4261vw, 7.8125vh);
}
100% {
  transform: translate(0);
}
`;


const rotateFade = keyframes`
  0% {
    transform: translate(0px, 5px);
  }
  50% {
    transform: translate(5px, 5px);
  }
  100% {
    transform: translate(0px, 5px);
  }
`;

const AnimatedIcon = styled.div`
  animation: ${rotateFade} 1s infinite;
  transform:translateY(6.2px);
`;

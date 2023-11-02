import { Input, Flex, Button, Text, Notification, Title, Box, ActionIcon } from '@mantine/core';
import { IconPlus, IconCheck, IconClipboard } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import styled, { keyframes } from 'styled-components';
import { useMantineTheme } from '@mantine/core';

function RoomCodeInput() {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;

  const theme = useMantineTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const [roomCode, setRoomCode] = useState<string>('');
  const [modRoomCode, setModRoomCode] = useState<string>('');
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
        // Check if the user already has a room code
        const { data: existingRoomCode } = await supabaseClient
          .from('user_mods')
          .select('roomcode')
          .eq('user_id', userId)
          .single();
        if (existingRoomCode?.roomcode) {
          roomCode = existingRoomCode.roomcode;
        } else {
          roomCode = await generateRoomCode();
          // Update the room code in the Supabase database
          await supabaseClient
            .from('user_mods')
            .update({ roomcode: roomCode })
            .eq('user_id', userId);
        }
        // Display the room code
        setRoomCode(roomCode);
      } catch (error) {
        console.error('An error occurred while updating the mods:', error);
        setRoomCode(''); // Moved the setRoomCode('') here.
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModRoomCode(e.target.value);
  }

  const fetchRoomCode = async () => {
    const { data: existingRoomCode, error } = await supabaseClient
      .from('user_mods')
      .select('roomcode, mymodpack')
      .eq('roomcode', modRoomCode)
      .single();

    if (error) {
      console.error(error.message);
    }

    // If found, store in cookie with the domain set to '.spark.study'
    if (existingRoomCode) {
      // If any 'roomMods' cookies exist, delete them
      const cookieKeys = Object.keys(Cookies.get());
      const roomModKeys = cookieKeys.filter(key => key.startsWith('roomMods'));
      if (roomModKeys.length > 0) {
        for (const key of roomModKeys) {
          Cookies.remove(key, { domain: '.spark.study', path: '/' });
        }
      }
      // Calculate the chunks
      const roomMods = existingRoomCode.mymodpack;
      const chunks = Math.ceil(roomMods.length / 3);
      // Split the roomMods into chunks and save each chunk as a separate cookie
      for (let i = 0; i < chunks; i++) {
        const start = i * 3;
        const end = start + 3;
        const chunk = roomMods.slice(start, end);
        Cookies.set(`roomMods${i + 1}`, JSON.stringify(chunk), { domain: '.spark.study', path: '/', sameSite: 'lax' });
      }

      setShowSuccess(true);
      setTimeout(() => window.location.href = process.env.SITE_URL || '', 2000);
    } else {
      console.error("Room code not found");
      setShowError(true); // Set showError to true when room code is not found
    }
  }



  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
      fetchRoomCode();
    }
  }

  return (
    <>
    <Box style={{padding:'0%', marginLeft:'1vw'}}>
    <SettingsContainer style={{fontFamily: '"Courier New", Courier, monospace', fontWeight:'bold', zIndex:'1', padding:'6%'}}>
          <Ball color="#378bff" />
          <Ball color="#378bff" />
          <Ball color="#E45A84" />
          <Ball color="#FFACAC" />
          <Box style={{
            marginTop:'6.2vh',
            padding:'5.5%',
            borderRadius:'5px',
            border:'1px solid rgba(160,160,160,0.3)',
            zIndex:'999',
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.white,
          }}>
    <Title style={{zIndex:'5'}}>Join a Room!</Title>
    {showSuccess && <Notification style={{zIndex:'5'}} color="green" title="Success" onClose={() => setShowSuccess(false)}>You have successfully joined the room!</Notification>}
    {showError && <Notification style={{zIndex:'5'}} color="red" title="Error" onClose={() => setShowError(false)}>Room code not found!</Notification>} {/* Display error notification when showError is true */}
    <Flex direction="row" style={{marginTop:'3vh'}}>
      <Input
        placeholder="Enter room code"
        onChange={handleChange}
        value={modRoomCode}
        onKeyPress={handleEnterKey}
        w="80%"
        height="17.5vh"
      />
<ActionIcon color="blue" radius="xs" size="lg" variant="subtle" onClick={fetchRoomCode} style={{borderTopRightRadius:'6px', borderBottomRightRadius:'6px'}}
      >
      <IconPlus size={20}/>
      </ActionIcon>
    </Flex>
    <Text color="gray" w="100%" style={{marginTop:'4vh', borderRadius:'6px', zIndex:'5', fontWeight:'400', background:'rgba(200,200,200,0.2)', padding:'3%', color: theme.colorScheme === 'dark' ? 'black' : 'inherit'}} align="left">
      Head over to &apos;My Mods&apos; and add your mods to a Shared Room. After that, you can share your room code with friends and they can enter it in here. Enjoy!
    </Text>
    {roomCode && (
      <>
<Flex direction="row" style={{marginTop:'3vh'}}>
          <Text size="lg" weight={500}>
        Your Room Code: {roomCode}
      </Text>
      <Button style={{transform:'translateY(-0.8vh)'}} variant="subtle" onClick={copyToClipboard} rightIcon={copySuccess ? <IconCheck /> : <IconClipboard />}>
        {copySuccess ? 'Copied!' : 'Copy'}
      </Button>
</Flex>
      </>
    )}
</Box>
    </SettingsContainer>
</Box>
    </>
  );
}

export default RoomCodeInput;

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

const Ball = styled.div`
  position: absolute;
  width: 4.3924vw;
  height: 7.8125vh;
  border-radius: 50%;
  z-index:1;
  background-color: ${({ color }) => color || 'red'};
  animation: ${bounceAnimation} 18s ease-in-out infinite;
  filter: blur(40px);
  opacity:0.5;

  &:nth-child(2) {
    animation-delay: 0.2s;
      animation: ${bounceAnimation2} 16s ease-in-out infinite;
      width: 7.3206vw;
      height: 13.0208vh;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
      animation: ${bounceAnimation3} 17s ease-in-out infinite;
      filter: blur(29px);
      opacity:0.25;
  }
  &:nth-child(4) {
    animation-delay: 0.7s;
      animation: ${bounceAnimation4} 19s ease-in-out infinite;
      width: 5.8565vw;
      height: 10.4167vh;
      filter: blur(34px);
      opacity:0.3;
  }
`;

const SettingsContainer = styled.div`
  background-image: linear-gradient(120deg, rgba(224,195,252,0.5) 0%, rgba(142,197,252,0.5) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position:absolute;
  transform:translate(-2vw,-6vh);
  height:90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border:1px solid rgba(0,0,0,0.18);

  ${Ball} {
    &:nth-child(1) {
      left: 15%;
      top: 5%;
    }

    &:nth-child(2) {
      left: 72%;
      top: 20%;
    }

    &:nth-child(3) {
      left: 45%;
      top: 5%;
    }
    &:nth-child(4) {
      left: 6%;
      top: 30%;
    }
  }
`;

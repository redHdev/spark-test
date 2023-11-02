import { useState, useEffect } from 'react';
import { Text, useMantineTheme, MediaQuery, Burger, AppShell, Header, Paper, Button, Flex, Input, Center, Box } from '@mantine/core';
import { useUser } from '@supabase/auth-helpers-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSearch } from '../context/SearchContext';
import { IconSearch } from '@tabler/icons-react';
import Cookies from 'js-cookie';
import { useActiveComponent } from '../context/NavContext';

import Sidebar from '../components/nav/sidebar';
import Mods from '../components/tabs/mods';
import Library from '../components/tabs/library';
import Laboratory from '../components/tabs/lab';
import JoinRoom from '../components/tabs/joinroom';
import Upload from '../components/tabs/upload';
import AccountTypeScreen from '../components/auth/AccountTypeScreen';

import dynamic from 'next/dynamic';

const Companions = dynamic(() => import('../components/tabs/chatbot'), {
  ssr: false,
});

import ImaGen from '../components/tabs/imagen';
import { useSidebarContext } from '../context/SidebarOpen';

export default function IndexPage() {
  const { setSearchTerm } = useSearch();
  const { opened, setOpened, toggleSidebar } = useSidebarContext();
  const user = useUser();

  const supabaseClient = useSupabaseClient();

  const theme = useMantineTheme();

  const { activeComponent, setActiveComponent } = useActiveComponent();

  const INITIAL_MODS = [
      {
        "xIcon": "settings",
        "xTags": [
          "settings",
          "default",
          "general"
        ],
        "xType": "character",
        "xTitle": "Default Settings",
        "xAuthor": "Spark Team",
        "xPrompt": "You are SparkGPT. You are the expanded version of ChatGPT. Users can: 1. Change the system prompt to whatever they'd like (create characters, personalities, etc.) 2. Change temperature, max tokens and other settings 3. Use GPT 4 and GPT 3.5 Turbo (16k) free for a limited time 4. Use text-to-speech and speech-to-textarea and 5. And all sorts of other things! Current date and time: {{ datetime }}",
        "xProduct": "sparkgpt",
        "iconColor": "grey",
        "xDescription": "Default system settings for SparkGPT with FAQ.",
        "xImpressionLevelRed": "null",
        "xShowEmotionalState": "false",
        "xImpressionLevelGreen": "null",
        "xShowImpressionLevels": "false"
      }
  ]

  useEffect(() => {
    setActiveComponent('Companions');
  }, []);

  useEffect(() => {
      if (!user) return;

      let userModCreationInProgress = false;

      async function checkAndCreateUserModRow(userId: string | null) {
          if (userModCreationInProgress) {
              return;
          }

          userModCreationInProgress = true;

          const { data: userMods, error } = await supabaseClient
              .from('user_mods')
              .select('*')
              .eq('user_id', userId);

          if (error) {
              console.error('Error fetching user mods: ', error.message);
              userModCreationInProgress = false;
              return;
          }

          if (!userMods.length) {
              const { data: newUserMod, error: insertError } = await supabaseClient
                  .from('user_mods')
                  .insert({ user_id: userId, mymods: INITIAL_MODS });

              if (insertError) {
                  console.error('Error creating new user mod: ', insertError.message);
              }
          }

          userModCreationInProgress = false;
      }

      const timer = setTimeout(() => {
          checkAndCreateUserModRow(user.id);
      }, 1000);

      return () => clearTimeout(timer);

  }, [user, supabaseClient]);

  const [mobileView, setMobileView] = useState(false);

  useEffect(() => {
      setMobileView(window.innerWidth <= 760);
  }, []);


  useEffect(() => {
    // Function to update state based on viewport width
    const updateMobileView = () => {
      setMobileView(window.innerWidth <= 760);
    };

    // Add event listener for window resize
    window.addEventListener("resize", updateMobileView);

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", updateMobileView);
  }, []);



useEffect(() => {
  if (window.innerWidth <= 768) {
    setOpened(false);
  }
}, [activeComponent]);

const [isHeaderVisible, setHeaderVisibility] = useState(true);

const [showConsentBox, setShowConsentBox] = useState(false);

useEffect(() => {
  const consentCookie = Cookies.get('cookie-consent');
  if (!consentCookie) {
    setShowConsentBox(true);
  }
}, []);

const handleConsent = () => {
  Cookies.set('cookie-consent', 'true', { expires: 365 });
  setShowConsentBox(false);
};

const [showAccountScreen, setShowAccountScreen] = useState<boolean | null>(null);

const handleAccountTypeSelected = () => {
  setShowAccountScreen(false);
};

useEffect(() => {
  if (!user) return;

  const checkUserAccountType = async () => {
    const { data } = await supabaseClient.from('account_types').select('user_account_type_selected').eq('user_id', user.id);
    if (data && data.length > 0) {
      setShowAccountScreen(!data[0].user_account_type_selected);
    } else {
      setShowAccountScreen(true);
    }
  };

  checkUserAccountType();
}, [user, supabaseClient]);

if (showAccountScreen) {
  return <AccountTypeScreen onAccountTypeSelected={handleAccountTypeSelected} />;
}

  return (
    <>
    <AppShell
      padding="0px"
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
        header={isHeaderVisible ? (
          <Header height={{ base: 50, md: 70 }} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
            <Burger
              opened={opened}
              onClick={toggleSidebar}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
            />
          </MediaQuery>

            <Flex direction="row">
              <Text style={{fontWeight:'bold'}}>SPARK</Text>
              <Center mx="auto">
              <Input
              placeholder="Search the library..."
              icon={<IconSearch size="1rem" />}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveComponent('Library');
              }}
              style={{width:'50vw', marginRight:'1.5vw', right:0, position:'absolute'}}
              />
              </Center>
            </Flex>
          </div>
          </Header>
        ) : undefined}
    >
    {(mobileView && opened) || !mobileView ? <Sidebar /> : null}
    <Box
      sx={(theme) => ({
        padding: theme.spacing.xs,
      })}
    >
      {activeComponent === 'Mods' && <Mods />}
      {activeComponent === 'Join Room' && <JoinRoom />}
      {activeComponent === 'Library' && <Library />}
      {activeComponent === 'Upload' && <Upload />}
      {activeComponent === 'ImaGen' && <ImaGen />}
    </Box>
    <div style={{position:'relative'}} >
    {activeComponent === 'Laboratory' && <Laboratory />}
    </div>
    <div style={{
      position: activeComponent === 'Companions' ? 'relative' : 'absolute',
      visibility: activeComponent === 'Companions' ? 'visible' : 'hidden'
    }}>
      <Companions />
    </div>
  </AppShell>
{showConsentBox && (
  <Box
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    }}
  >
    <Paper style={{
        textAlign: 'center',
        padding:'15px',
        boxShadow: '0px -5px 10px rgba(50, 50, 50, 0.1)',
        backgroundColor: 'transparent',
      }}
    >
      <Text style={{ opacity: 0.75, textAlign:'left' }}>This website uses cookies only for enhancing user experience and communicating with AI models. <a href="https://spark.study/info/cookies" style={{ color: '#228BE6', textDecoration: 'underline' }}>Learn more</a></Text>
      <Button onClick={handleConsent} style={{ marginTop: '10px' }}>Agree</Button>
      <Button onClick={handleConsent} style={{marginLeft:'7px', marginTop: '10px'}}>Only necessary cookies</Button>
    </Paper>
  </Box>
)}
</>
  );
}

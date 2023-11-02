import { AppProps } from "next/app";
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { appWithTranslation, SSRConfig } from 'next-i18next';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import Head from "next/head";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { createClient } from "@supabase/supabase-js";
import SegmentedToggle from '../components/inputs/ThemeSwitcher';
import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import StyledLoader from '../components/loader';
import { Database } from '../types/supabase';
import { SearchContext } from '../context/SearchContext';
import { SidebarProvider } from '../context/SidebarOpen';
import { ThemeSwitcherProvider } from '../context/ThemeSwitcher';
import Image from 'next/image';
import styled, { keyframes } from 'styled-components';
import { IntlProvider } from 'react-intl';
import { SelectedItemProvider } from '../context/SettingsContext';
import { NavProvider } from '../context/NavContext';
import { MessageProvider } from '../context/MessageContext';
import { CompanionProvider } from '../context/MemoriesContext';
import { FileProvider } from '../context/FileContext';
import { TestProvider } from '../context/TestContext';
import { ConfigProvider } from "../context/ConfigContext";
import { getDomainName } from "../lib/helpers";
import { PromptProvider } from "../context/PromptConfig";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
  },
});

const queryClient = new QueryClient();

function App({
  Component,
  pageProps,
}: AppProps<{ cookies?: NextApiRequestCookies; initialSession?: Session | null } & SSRConfig>) {
  const router = useRouter();

  function checkAndDeleteDuplicateTokens() {
    const allCookies = Cookies.get();
    const authTokenCount = Object.keys(allCookies).filter(key => key === 'supabase-auth-token').length;

    if (authTokenCount > 1) {
      return true;
    }
    return false;
  }

  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient({
      cookieOptions: {
        domain: 'localhost',
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    })
  );
  useEffect(() => {
    if (checkAndDeleteDuplicateTokens()) {
      window.location.href = process.env.SITE_URL || "";
    }
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && (router.asPath.startsWith('/app') || router.asPath.startsWith('/account')))
        router.replace('/auth/signin');
    });

    return () => subscription.unsubscribe();
  }, [supabaseClient.auth, router.asPath]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useMediaQuery('(max-width: 576px)');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/chat/')) {
      window.location.href = process.env.SITE_URL || "";
    }
  }, []);

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  const toggleColorScheme = () => {
    setColorScheme((prevScheme) => (prevScheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
      const timer = setTimeout(() => {
          setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Spark Menu</title>
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="viewport" content="minimum-scale=1, width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
      </Head>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <ConfigProvider>
        <PromptProvider>
          <ThemeSwitcherProvider>
            <IntlProvider locale="en">
              <MessageProvider>
                <CompanionProvider>
                  <QueryClientProvider client={queryClient}>
                    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                      <MantineProvider
                        withGlobalStyles
                        withNormalizeCSS
                        theme={{ colorScheme }}
                      >
                              {loading ? (
                                  <>
                                  <StyledLoader />
                                  </>
                                ) : (
                                <>
                                 <SelectedItemProvider>
                                    <div style={{ position: 'absolute', top: 0, left:0, marginLeft:'4vw', marginTop: isMobile ? '0vh' : '1vh', zIndex:'99999'}}>
                                      <SegmentedToggle setColorScheme={setColorScheme} />
                                    </div>
                                    <NavProvider>
                                    <SidebarProvider>
                                    <FileProvider>
                                    <TestProvider>
                                    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
                                      <Component {...pageProps} />
                                    </SearchContext.Provider>
                                    </TestProvider>
                                    </FileProvider>
                                    </SidebarProvider>
                                    </NavProvider>
                                  </SelectedItemProvider>
                                </>
                          )}
                      </MantineProvider>
                    </ColorSchemeProvider>
                  </QueryClientProvider>
                </CompanionProvider>
              </MessageProvider>
            </IntlProvider>
          </ThemeSwitcherProvider>
        </PromptProvider>
      </ConfigProvider>
      </SessionContextProvider>
    </>
  );
}

export default appWithTranslation(App);

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  return {
    props: {
      cookies: req.cookies,
    },
  };
};

import { Button, Image, Box } from '@mantine/core';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Provider } from '@supabase/supabase-js';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo } from 'react';
import React from 'react';
import {
  FaApple,
  FaBitbucket,
  FaDiscord,
  FaFacebook,
  FaGithub,
  FaGitlab,
  FaGoogle,
  FaLinkedin,
  FaMicrosoft,
  FaSlack,
  FaSpotify,
  FaTwitch,
  FaTwitter,
} from 'react-icons/fa';
import { SiNotion } from 'react-icons/si';
import { redirectPath } from '../../config/auth';
import { useAuthRedirectUrl } from '../../lib/client/auth';

export default function SocialSignInButton({
  provider,
  redirectAfterSignin,
}: {
  provider: Provider;
  redirectAfterSignin?: string;
}) {
  const supabaseClient = useSupabaseClient();
  const { t } = useTranslation('auth');
  const redirectTo = useAuthRedirectUrl(
    `/auth/callback?redirectAfterSignin=/`
  );

  const providers = useMemo<
    Partial<
      Record<
        Provider,
        {
          name: string;
          color: string;
          icon?: React.ReactNode;
        }
      >
    >
  >(
    () => ({
      google: {
        name: 'Google',
        icon: <FaGoogle />,
        color: '#E25049',
      },
      apple: {
        name: 'Apple',
        icon: <FaApple />,
        color: '#000',
      },
      facebook: {
        name: 'Facebook',
        icon: <FaFacebook />,
        color: '#3b5998',
      },
      twitter: {
        name: 'Twitter',
        icon: <FaTwitter />,
        color: '#1DA1F2',
      },
      github: {
        name: 'Github',
        icon: <FaGithub />,
        color: '#222',
      },
      azure: {
        name: 'Azure',
        icon: <FaMicrosoft />,
        color: '#0078d4',
      },
      bitbucket: {
        name: 'BitBucket',
        icon: <FaBitbucket />,
        color: '#205081',
      },
      linkedin: {
        name: 'LinkedIn',
        icon: <FaLinkedin />,
        color: '#0077b5',
      },
      discord: {
        name: 'Discord',
        icon: <FaDiscord />,
        color: '#7289DA',
      },
      gitlab: {
        name: 'Gitlab',
        icon: <FaGitlab />,
        color: '#f39c12',
      },
      keycloak: {
        name: 'Keycloak',
        color: '#00a0e3',
      },
      notion: {
        name: 'Notion',
        icon: <SiNotion />,
        color: '#000',
      },
      slack: {
        name: 'Slack',
        icon: <FaSlack />,
        color: '#2eb886',
      },
      spotify: {
        name: 'Spotify',
        icon: <FaSpotify />,
        color: '#1db954',
      },
      twitch: {
        name: 'Twitch',
        icon: <FaTwitch />,
        color: '#6441a5',
      },
      workos: {
        name: 'Workos',
        color: '#6363f1',
      },
    }),
    [t]
  );

  const providerData = useMemo(() => providers[provider], [provider, providers]);

  const signIn = useCallback(
    () => supabaseClient.auth.signInWithOAuth({ provider, options: { redirectTo } }),
    [provider, redirectTo, supabaseClient.auth]
  );

  if (!providerData) {
    return null;
  }

  const isGoogle = provider === 'google';

  return (
    <Button
      fullWidth
      variant="outline"
      style={{
        backgroundColor: isGoogle ? '#fbfbfb' : providerData.color,
        color: isGoogle ? '#101010' : 'white',
        borderColor: isGoogle ? '#121212' : 'transparent',
        marginTop:'1vh'
      }}
      onClick={signIn}
    >
      {isGoogle ? (
        <Image src="https://www.salesforceben.com/wp-content/uploads/2021/03/google-logo-icon-PNG-Transparent-Background.png" width={24} style={{ marginRight: '0.5rem' }} />
      ) : providerData.icon && (
        <Box style={{ fontSize: '150%', marginRight: '0.5rem', color:'white', background:'transparent' }}>
          {providerData.icon}
        </Box>
      )}
      Continue with {providerData.name}
    </Button>
  );
}

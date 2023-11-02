import { Container, Text, Paper, Box, Flex } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useEffect } from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import SigninForm from '../../components/auth/SigninForm';
import SignupForm from '../../components/auth/SignupForm';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import Logo from '../../components/Logo';
import { redirectPath } from '../../config/auth';
import { Database } from '../../types/supabase';
import { useThemeSwitcher } from '../../context/ThemeSwitcher';

const authActions = ['signup', 'signin', 'forgot-password', 'reset-password'];

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const { params, locale } = ctx;
    const action = params?.action as string;

    if (!action || !authActions.includes(action)) {
      console.log("Invalid action provided:", action);
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }

    const supabaseClient = createServerSupabaseClient<Database>(ctx);
    const { data: session, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("Error retrieving session:", sessionError);
    }

    const isUserLoggedIn = !!session?.session;

    if (!isUserLoggedIn && action === 'reset-password') {
      console.log("User not logged in, redirecting to signin");
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }

    if (isUserLoggedIn && action !== 'reset-password') {
      console.log("User is logged in, redirecting to home page");
      return {
        redirect: {
          destination: redirectPath,
          permanent: false,
        },
      };
    }

    return {
      props: {
        ...(await serverSideTranslations(locale!, ['common', 'auth'])),
        action,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getServerSideProps:", error);
    return {
      props: {}
    };
  }
};

export default function AuthPage({ action }: { action: string }) {
  const name = 'Spark Engine';
  const isMobile = useMediaQuery('(max-width: 746px)');
  const { setShowThemeSwitcher } = useThemeSwitcher();

  useEffect(() => {
    setShowThemeSwitcher(false);
  }, [setShowThemeSwitcher]);

  return (
    <>
      <Head>
        <title>{name} AI</title>
        <link rel="icon" type="image/png" href="/favicon.ico" />
      </Head>
      <Box style={{width:'100vw'}}>
      <Paper style={{ width: '100vw', minHeight: '79vh', marginTop:'5vh', padding:'5px' }}>
        <Container style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <Container style={{maxWidth: isMobile ? '100%' : '50%'}}>
          <AuthFormWrapper>
            <Logo />
            {action === 'signup' && <SignupForm />}
            {action === 'signin' && <SigninForm />}
            {action === 'forgot-password' && <ForgotPasswordForm />}
            {action === 'reset-password' && <ResetPasswordForm />}
          </AuthFormWrapper>
            <Container style={{ justifyContent: 'space-between' }}>
            <Flex style={{width:'100%'}} justify="center">
              <Text style={{ paddingTop: '0.5rem', color: 'gray', fontSize:'13px' }}>
                2023 © Spark Engine AI | All rights reserved
              </Text>
            </Flex>
            </Container>
          </Container>
        </Container>
      </Paper>
      </Box>
    </>
  );
}

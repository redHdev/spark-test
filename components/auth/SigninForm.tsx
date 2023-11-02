import { useEffect, useState, FormEvent } from 'react';
import {
  Button,
  Text,
  TextInput,
  Alert,
  Title,
  Container,
  Flex,
  Divider,
  Box,
  Paper,
} from '@mantine/core';
import { FaAt, FaLock } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { redirectPath } from '../../config/auth';
import { useAuthRedirectUrl } from '../../lib/client/auth';
import { invalidateNextRouterCache } from '../../lib/helpers';
import { Database } from '../../types/supabase';
import SigninModeSwitch, { SigninMode } from './SigninModeSwitch';
import SocialSignInButton from './SocialSignInButton';

function SigninForm() {
  const [insideWebView, setInsideWebView] = useState(false);
  const name = 'Spark Engine';
  const [mode, setMode] = useState<SigninMode>(SigninMode.MagicLink);
  const router = useRouter();
  const { query } = router;
  const referralCode = router.query.referral;

  const supabaseClient = useSupabaseClient<Database>();

  const redirectAfterSignin = query.redirectAfterSignin && query.redirectAfterSignin !== "#"
    ? decodeURIComponent(query.redirectAfterSignin as string)
    : redirectPath;

  const redirectTo = useAuthRedirectUrl(
    mode === SigninMode.MagicLink
      ? `/auth/callback?redirectAfterSignin=/`
      : redirectAfterSignin
  );

  const { register, handleSubmit, setError, clearErrors, formState, reset } = useForm<{
    email: string;
    password?: string;
    serverError?: void;
  }>();
  const { isSubmitting, isSubmitted, isSubmitSuccessful } = formState;

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ email, password }) => {
      console.log("Submitting with referral code:", referralCode);
      if (referralCode) {
        sessionStorage.setItem('referral', referralCode as string);
      }

      const { error } =
        mode === SigninMode.Password && password
          ? await supabaseClient.auth.signInWithPassword({ email, password })
          : await supabaseClient.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: redirectTo,
              },
            });

      if (error) {
        setError('serverError', {
          type: 'invalidCredentials',
        });
        return;
      }

      if (mode === SigninMode.Password) {
        invalidateNextRouterCache();
        await router.replace(redirectAfterSignin);
      }
    })(e);
  };


  useEffect(() => reset(), [mode]);

  useEffect(() => {
  if (query.referral) {
    sessionStorage.setItem('referral', query.referral as string);
  }
  console.log("Referral code:", referralCode);
}, []);

function isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor;
    return (
        ua.indexOf("FBAN") > -1 ||
        ua.indexOf("FBAV") > -1 ||
        ua.indexOf("Twitter") > -1 ||
        ua.indexOf("Instagram") > -1 ||
        ua.indexOf("Snapchat") > -1 ||
        ua.indexOf("Pinterest") > -1 ||
        ua.indexOf("Line") > -1 ||
        ua.indexOf("LinkedIn") > -1 ||
        ua.indexOf("Reddit") > -1 ||
        ua.indexOf("Tumblr") > -1 ||
        ua.indexOf("WhatsApp") > -1 ||
        ua.indexOf("TikTok") > -1
    );
}

useEffect(() => {
    setInsideWebView(isInAppBrowser());
}, []);

return (
  <Container>
    <Title order={1}>Welcome</Title>
    <Paper>
      <Text color="dimmed">Sign in to {name} below!</Text>

      <Divider style={{ margin: '1.25rem 0' }} />

      <SigninModeSwitch activeMode={mode} onChange={setMode} />

      <form onSubmit={onSubmit}>
        {isSubmitted && (
          <Alert color={isSubmitSuccessful ? 'green' : 'red'} style={{marginTop:'10px'}}>
            {isSubmitSuccessful
              ? mode === SigninMode.Password
                ? 'Signing in...'
                : 'Link Sent!'
              : 'Error signing in!'}
          </Alert>
        )}

        {(!isSubmitted || !isSubmitSuccessful) && (
          <>
            <TextInput
              {...register('email', { required: true })}
              placeholder="Email"
              style={{marginTop:'10px'}}
              icon={<FaAt />}
            />

            {mode === 'password' && (
              <>
                <TextInput
                  style={{marginTop:'10px'}}
                  {...register('password', { required: true })}
                  placeholder="Password"
                  type="password"
                  icon={<FaLock />}
                />
              </>
            )}
            <Flex style={{marginTop:'10px'}}>
            <Button type="submit" variant="light" loading={isSubmitting}>
              {mode === 'password' ? 'Sign In' : 'Send Link'}
            </Button>
            <NextLink href="/auth/signup" passHref>
                <Button variant="transparent">Sign up &rarr;</Button>
            </NextLink>
            {mode === 'password' && (
              <Flex justify="flex-end" style={{width:'100%'}}>
              <NextLink href="/auth/forgot-password" passHref>
                  <Button variant="transparent" size="xs" style={{opacity:'0.75'}}>Forgot Password?</Button>
              </NextLink>
              </Flex>
            )}
            </Flex>
          </>
        )}
      </form>
      <Box style={{marginTop:'10px'}}>
      </Box>
      <Divider style={{ margin: '1rem 0' }} />

      {insideWebView ? (
        <Alert color="blue">
          <Text>
            We noticed you&apos;re on a 3rd party application! Please sign in using your device&apos;s browser.
          </Text>
        </Alert>
      ) : (
        <Flex direction="column">
          <SocialSignInButton provider="github" redirectAfterSignin={redirectAfterSignin} />
        </Flex>
      )}

    </Paper>
  </Container>
);
}

export default SigninForm;

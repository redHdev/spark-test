import { Button, Text, Input, Paper, Notification, Group, Container, Title, Divider, Flex, ActionIcon } from '@mantine/core';
import { IconUser, IconMail, IconLock, IconArrowBack } from '@tabler/icons-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState, useCallback, FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { redirectPath } from '../../config/auth';
import { useAuthRedirectUrl } from '../../lib/client/auth';

function SignupForm() {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const redirectTo = useAuthRedirectUrl();
  const { register, handleSubmit, formState, setError, clearErrors } = useForm<{
    email: string;
    password: string;
    name: string;
    serverError?: void;
  }>();
  const { isSubmitting, isSubmitted, isSubmitSuccessful } = formState;
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const name = 'Spark Engine';

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ email, password, name }) => {
      const {
        data: { session, user: newUser },
        error,
      } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectTo,
        },
      });

      if (error || !newUser) {
        setError('serverError', { message: error?.message });
        return;
      }

      // if email confirmations are enabled, the user will have to confirm their email before they can sign in
      if (!session) return;

      // if email confirmations are disabled, the user will be signed in automatically and redirected
      await router.push(redirectPath);
    })(e);
  };

  const togglePassword = useCallback(() => setPasswordVisible(!isPasswordVisible), [isPasswordVisible]);

  return (
    <Container>
      <Title order={1}>Welcome</Title>
      <Paper>
        <Text color="dimmed">Make an account for {name} below!</Text>

        <Divider style={{ margin: '1.25rem 0' }} />
      <form onSubmit={onSubmit}>
        <Group>
          {isSubmitted &&
            (isSubmitSuccessful ? (
              <Notification color="green">
                <Text>Your account has been created. Please check your email to confirm your account.</Text>
              </Notification>
            ) : (
              <Notification color="red">
                <Text>An error occured while trying to create your account. Please try again.</Text>
              </Notification>
            ))}

          {(!isSubmitted || !isSubmitSuccessful) && (
            <Flex style={{width:'100%'}} justify="center" direction="column" gap="sm">
              <Input
                icon={<IconUser />}
                autoComplete="name"
                placeholder='Set username...'
                {...register('name', { required: true })}
              />

              <Input
                icon={<IconMail />}
                required
                type="email"
                autoComplete="email"
                placeholder='Set email...'
                {...register('email', { required: true })}
              />

              <Input
                icon={<IconLock />}
                required
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder='Set password...'
                rightSection={
                  <Button onClick={togglePassword} variant="transparent">
                    {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                }
                {...register('password', { required: true })}
              />

              <Flex style={{width:'100%'}}>

              <NextLink href="/auth/signin" passHref>
              <ActionIcon variant="transparent" size="lg">
                <IconArrowBack size={20}/>
              </ActionIcon>
              </NextLink>

              <Button type="submit" variant="light" loading={isSubmitting} style={{width:'100%'}}>
                Create account
              </Button>

              </Flex>
            </Flex>
          )}
        </Group>
      </form>
    </Paper>
    </Container>
  );
}

export default SignupForm;

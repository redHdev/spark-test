import { Button, Input, Notification, Paper, Title, Divider, Text, Container, Flex, ActionIcon } from '@mantine/core';
import { IconArrowBack } from '@tabler/icons-react';
import NextLink from 'next/link';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { FormEvent, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { redirectPath } from '../../config/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const { register, handleSubmit, formState, setError, clearErrors } = useForm<{
    password: string;
    serverError?: void;
  }>();
  const { isSubmitting, isSubmitted, isSubmitSuccessful } = formState;
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const name = 'Spark Engine'

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ password }) => {
      const { error } = await supabaseClient.auth.updateUser({ password });

      if (error) {
        setError('serverError', { message: error.message });
        return;
      }

      await router.push(redirectPath);
      // notifications.showNotification({
      //   title: t('resetPassword.successMessage'),
      //   color: 'green',
      // });
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
        <div style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>

        {isSubmitted && (
          isSubmitSuccessful
            ? <Notification color="green" title='Your password was updated successfully.' />
            : <Notification color="red" title='An error occured while trying to reset your password. Please try again.' />
        )}
          <div>
            <Input
              required
              placeholder="Set new password..."
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              icon={<FaLock />}
              rightSection={
                <Button onClick={togglePassword} variant="transparent">
                  {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                </Button>
              }
              {...register('password', { required: true })}
            />
          </div>
          <Flex style={{width:'100%', marginTop:'10px'}}>

          <NextLink href="/auth/signin" passHref>
          <ActionIcon variant="transparent" size="lg">
            <IconArrowBack size={20}/>
          </ActionIcon>
          </NextLink>
          <Button color="blue" type="submit" style={{width:'100%'}} variant="light" loading={isSubmitting}>
            Save new password
          </Button>
          </Flex>
        </div>
      </form>
      </Paper>
      </Container>
  );
}

export default ResetPasswordForm;

import { Alert, Button, Text, TextInput, Paper, Group, Title, Container, Divider, Flex, ActionIcon } from '@mantine/core';
import { IconArrowBack } from '@tabler/icons-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import NextLink from 'next/link';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FaAt } from 'react-icons/fa';
import { useAuthRedirectUrl } from '../../lib/client/auth';

function ForgotPasswordForm() {
  const supabaseClient = useSupabaseClient();
  const redirectTo = useAuthRedirectUrl(
    `/auth/callback?redirectAfterSignin=${encodeURIComponent('/auth/reset-password')}`
  );
  const { register, handleSubmit, formState, setError, clearErrors } = useForm<{ email: string; serverError?: void }>();
  const { isSubmitting, isSubmitted, isSubmitSuccessful } = formState;

  const onSubmit = (e: FormEvent) => {
    clearErrors('serverError');
    handleSubmit(async ({ email }) => {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        setError('serverError', { type: 'manual', message: error.message });
      }
    })(e);
  };

  return (
    <Container>
      <Title order={1}>Welcome</Title>
      <Paper>
        <Text color="dimmed">Forgot your password? Enter your email below.</Text>

        <Divider style={{ margin: '1.25rem 0' }} />
      <form onSubmit={onSubmit}>
        <Paper>
        {isSubmitted && (
          <Alert color={isSubmitSuccessful ? 'teal' : 'red'}>
            {isSubmitSuccessful ? 'Link sent. Please check your inbox.' : 'We could not send you a link to reset your password. Please make sure, you entered the correct email and try again.'}
          </Alert>
        )}

          {(!isSubmitted || !isSubmitSuccessful) && (
            <Group>
            <Flex direction="column" style={{width:'100%'}}>
              <div>
                <TextInput
                  icon={<FaAt />}
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email..."
                  {...register('email', {
                    required: true,
                  })}
                />
              </div>

              <Flex style={{width:'100%', marginTop:'10px'}}>

              <NextLink href="/auth/signin" passHref>
              <ActionIcon variant="transparent" size="lg">
                <IconArrowBack size={20}/>
              </ActionIcon>
              </NextLink>

              <Button type="submit" variant="light" style={{width:'100%'}} loading={isSubmitting}>
                Send link
              </Button>

              </Flex>
              </Flex>
            </Group>
          )}
        </Paper>
      </form>
    </Paper>
    </Container>
  );
}

export default ForgotPasswordForm;

import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button, Input, Text, Paper, Flex, Title, Box, ActionIcon } from '@mantine/core';
import { IconArrowBack } from '@tabler/icons-react';
import { useThemeSwitcher } from '../../context/ThemeSwitcher';

interface AccountTypeScreenProps {
  onAccountTypeSelected: () => void;
}

const AccountTypeScreen = ({ onAccountTypeSelected }: AccountTypeScreenProps) => {
  const { setShowThemeSwitcher } = useThemeSwitcher();
  const supabase = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const USER_LABEL = "Student";
  const MODERATOR_LABEL = "Teacher";
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const createUserAccountTypeRow = async () => {
      const { data, error } = await supabase.from('account_types').select('*').eq('user_id', userId);
      if (error || !data) {
        console.error('Error fetching user account type:', error?.message);
        return;
      }

      if (data.length === 0) {
        await supabase.from('account_types').insert([{ user_id: userId }]);
      }
    };

    if (userId) {
      createUserAccountTypeRow();
    }
  }, [userId, supabase]);

  const handleAccountTypeSelect = async (type: string) => {
    if (type === 'user') {
      const { error } = await supabase.from('account_types').update({ user_account_type: 'user', user_account_type_selected: true }).eq('user_id', userId);
      if (!error) {
        onAccountTypeSelected();
        window.location.reload();
      }
    } else {
      setShowCodeInput(true);
    }
  };

  const handleCodeSubmit = async () => {
    const { data, error } = await supabase.from('account_type_setup').select('moderator_code, admin_code').single();

    if (error) {
      setError('An error occurred while fetching the code.');
      return;
    }

    if (data.moderator_code === code || data.admin_code === code) {
      const accountType = data.admin_code === code ? 'admin' : 'moderator';
      const { error: updateError } = await supabase.from('account_types').update({ user_account_type: accountType, user_account_type_selected: true }).eq('user_id', userId);
      setShowCodeInput(false);
      if (!updateError) {
        onAccountTypeSelected();
        window.location.reload();
      }
    } else {
      setError('The entered code is incorrect.');
    }
  };


  useEffect(() => {
    setShowThemeSwitcher(false);
    return () => {
      setShowThemeSwitcher(true);
    };
  }, [setShowThemeSwitcher]);

  return (
    <Flex style={{ height: '100vh' }} justify="center" align="center">
      <Paper shadow="sm" style={{ padding: '20px', width: '250px', height: '40vh' }}>
        <Flex direction="column" justify="center" align="center" style={{ height: '100%' }}>
          <Title align="left" size="md" style={{ marginBottom: '10px' }}>What is your role?</Title>

          {showCodeInput ? (
            <>
              <Box style={{ paddingTop: '10px', transform: 'translateY(-5px)', width: '100%' }}>
                <Input placeholder="Enter your code..." value={code} onChange={(event) => setCode(event.currentTarget.value)} style={{ width: '100%' }} />
              </Box>
              <Flex justify="space-between" align="center" style={{ width: '100%', marginTop: '10px' }}>
                <ActionIcon variant="light" color="blue" size="lg" onClick={() => setShowCodeInput(false)} >
                  <IconArrowBack size={20}/>
                </ActionIcon>
                <Button onClick={handleCodeSubmit} style={{width:'80%'}}>Submit</Button>
              </Flex>
              {error && <Text color="red">{error}</Text>}
            </>
          ) : (
            <>
              <Button onClick={() => handleAccountTypeSelect('user')} style={{ margin: '5px 0' }} fullWidth>{USER_LABEL}</Button>
              <Button onClick={() => handleAccountTypeSelect('moderator')} style={{ margin: '5px 0' }} fullWidth>{MODERATOR_LABEL}</Button>
            </>
          )}
        </Flex>
      </Paper>
    </Flex>
  );
};

export default AccountTypeScreen;

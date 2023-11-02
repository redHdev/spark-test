import { Flex } from '@mantine/core';
import { useSessionContext, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { redirectPath } from '../../config/auth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useThemeSwitcher } from '../../context/ThemeSwitcher';

export default function AuthCallbackPage() {
  const router = useRouter();
  const user = useUser();
  const { isLoading } = useSessionContext();
  const supabaseClient = useSupabaseClient();
  const { setShowThemeSwitcher } = useThemeSwitcher();

  useEffect(() => {
    setShowThemeSwitcher(false);
  }, [setShowThemeSwitcher]);

  const { query } = router;
  const redirectTo = query.redirectAfterSignin ? decodeURIComponent(query.redirectAfterSignin as string) : redirectPath;

  useEffect(() => {
    if (!isLoading && user) router.push(redirectTo);
  }, [user, isLoading, router, redirectTo]);

  // fallback if the user is not loaded after 5s to make sure this page is not shown forever
  useEffect(() => {
    const timeout = setTimeout(() => router.push('/'), 5000);
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <Flex align="center" justify="center"></Flex>
  );
}

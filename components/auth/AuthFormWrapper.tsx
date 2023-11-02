import { Flex, Paper } from '@mantine/core';
import { PropsWithChildren, ReactElement, useEffect } from 'react';
import { useThemeSwitcher } from '../../context/ThemeSwitcher';

interface Props {
  title?: string;
  description?: string | ReactElement;
}

export default function AuthFormWrapper({ children }: PropsWithChildren<Props>) {

  const { setShowThemeSwitcher } = useThemeSwitcher();

  useEffect(() => {
    setShowThemeSwitcher(false);
    return () => {
      setShowThemeSwitcher(true);
    };
  }, [setShowThemeSwitcher]);

  return (
    <Flex direction="column" style={{ margin: 'auto', width:'100%' }}>
    <Paper style={{padding:'20px'}} shadow="sm">
      <div>{children}</div>
    </Paper>
    </Flex>
  );
}

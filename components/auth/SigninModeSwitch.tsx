import { Flex, Container, Text, Paper } from '@mantine/core';
import { useMemo } from 'react';

export enum SigninMode {
  Password = 'password',
  MagicLink = 'magic-link',
}

export default function SigninModeSwitch({
  activeMode,
  onChange,
}: {
  activeMode: SigninMode;
  onChange: (mode: SigninMode) => void;
}) {

  const modes = useMemo<Array<{ key: SigninMode; title: string }>>(
    () => [
      {
        key: SigninMode.MagicLink,
        title: 'Use link',
      },
      {
        key: SigninMode.Password,
        title: 'Password',
      },
    ],
    []
  );

  return (
    <Container size="lg">
      <Flex align="center" justify="center" style={{ borderBottom: '2px solid #e3e8ee' }}>
        {modes.map((mode) => (
          <Paper
            key={mode.key}
            component="button"
            style={{
              width: '50%',
              borderBottom: `1px solid ${mode.key === activeMode ? 'black' : 'transparent'}`,
              borderTop:'0px',
              borderLeft:'0px',
              borderRight:'0px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: mode.key === activeMode ? 'bold' : 'normal',
              color: mode.key === activeMode ? 'black' : 'inherit',
            }}
            onMouseEnter={() => (mode.key === activeMode ? 'black' : '#3f63f5')}
            onClick={() => onChange(mode.key)}
          >
            <Text align="center">{mode.title}</Text>
          </Paper>
        ))}
      </Flex>
    </Container>
  );
}

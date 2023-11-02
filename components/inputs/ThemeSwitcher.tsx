import { useMantineColorScheme, ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useMediaQuery } from "@mantine/hooks";
import { useThemeSwitcher } from '../../context/ThemeSwitcher';

interface ButtonToggleProps {
  setColorScheme: (colorScheme: 'light' | 'dark') => void;
}

export default function ThemeSwitcher({ setColorScheme }: ButtonToggleProps) {
  const { colorScheme } = useMantineColorScheme();
  const { showThemeSwitcher } = useThemeSwitcher();
  const isMobile = useMediaQuery('(max-width: 576px)');
  const handleClick = () => {
    const newValue = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newValue);
  };

  return (
    <>
    {showThemeSwitcher && (
      <ActionIcon onClick={handleClick} style={{position:'fixed', left: isMobile ? '40%' : '45%', marginTop:'1.5vh'}} variant="transparent" color="dark">
        {colorScheme === 'light' ? <IconSun size="1rem" stroke={1.5} /> : <IconMoon size="1rem" stroke={1.5} />}
      </ActionIcon>
    )}
    </>
  );
}

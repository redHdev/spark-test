import { Button } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';

interface OpenNavbarButtonProps {
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OpenNavbarButton({ setMenuOpen }: OpenNavbarButtonProps) {
  return (
    <Button onClick={() => setMenuOpen(true)}>
      <IconMenu2 />
    </Button>
  );
}

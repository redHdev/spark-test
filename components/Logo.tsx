import { Flex, Text } from '@mantine/core';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" style={{fontWeight:'bold', color:'black', textDecoration:'none'}}>
      <Flex align="center" style={{ lineHeight: 1, fontSize: '2xl'}}>
        <Text style={{ fontWeight: 'bold' }}>
          SPARK
        </Text>
      </Flex>
    </Link>
  );
}

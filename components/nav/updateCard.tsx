import { Card, Text, Badge, Button, Group, Flex } from '@mantine/core';

export default function UpdateCard() {

  function redirectToSparkGPTV3Blog(): void {
      const url = "https://spark.study/blog/introducing-sparkgpt-v3-companions-update";
      window.open(url, '_blank');
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group position="apart" mt="md" mb="xs">
      <Flex>
        <Text weight={500}>V3 - Companions</Text>
        <Badge color="blue" variant="light" size="xs" style={{marginLeft:'3px'}}>
          NEW UPDATE
        </Badge>
        </Flex>
      </Group>

      <Text size="sm" color="dimmed">
        Create your own shareable chatbot companion using our menu.
      </Text>

      <Button
          variant="light"
          color="blue"
          fullWidth
          mt="md"
          radius="md"
          onClick={redirectToSparkGPTV3Blog}
      >
          Visit blog
      </Button>
    </Card>
  );
}

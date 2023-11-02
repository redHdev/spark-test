import { useEffect, useState } from 'react';
import { Text, List, Flex, ScrollArea } from "@mantine/core";
import { IconPlus, IconFile } from '@tabler/icons-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

type MemoryType = {
  memory_name: string;
  created_at: string;
  companion_id: string;
  memory_type: string;
};

interface MemoryWidgetProps {
  onItemSelected: (item: MemoryType) => void;
}

export default function MemoryWidget({ onItemSelected }: MemoryWidgetProps) {
  const [memories, setMemories] = useState<Partial<MemoryType>[]>([]);
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      const { data: fetchedData, error } = await supabaseClient
        .from('memories')
        .select('memory_name, created_at, companion_id, memory_type')
        .eq('companion_id', userId)
        .eq('memory_type', 'written');

      if (error) {
        console.error("Failed to fetch memories", error);
      } else {
        setMemories(fetchedData);
      }
    };

    fetchData();
  }, [userId, supabaseClient]);

  const selectItem = (item: Partial<MemoryType>) => {
    if (typeof onItemSelected === 'function') {
      onItemSelected(item as MemoryType);
    } else {
      console.error('onItemSelected is not a function or not defined');
    }
  };

  return (
    <>
      <Flex direction="column" justify="flex-end" align="flex-start">
        <IconPlus size={20}/>
      </Flex>
      <ScrollArea h={420} style={{width: '100%'}}>
        <List
          spacing="xs"
          size="sm"
          center
        >
          {memories.map((memory, index) => (
            <List.Item
              key={index}
              icon={<IconFile size={20}/>}
              onClick={() => selectItem(memory)}
            >
              <div>
                <Text>{memory.memory_name}</Text>
                <Text size="sm" color="dimmed" weight={400}>
                  {memory.created_at}
                </Text>
              </div>
            </List.Item>
          ))}
        </List>
      </ScrollArea>
    </>
  );
}

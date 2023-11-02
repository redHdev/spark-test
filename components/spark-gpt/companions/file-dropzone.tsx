import { Group, Text, List, useMantineTheme, rem, Flex, Progress } from '@mantine/core';
import { IconFileUpload, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';
import { useCompanion } from '../../../context/MemoriesContext';
import { useFiles } from '../../../context/FileContext';

export default function FileDropzone(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const { setUploadedFile } = useFiles();
  const { setIsFileDropzoneOpen, selectedCompanion } = useCompanion();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [chunksRemaining, setChunksRemaining] = useState<number>(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const companionId = selectedCompanion.companion_id;

  function splitTextByWordCount(text: string, maxWords: number) {
      const words = text.split(/\s+/);
      const allChunks = [];
      let chunk: string[] = [];

      for (const word of words) {
          chunk.push(word);

          if (chunk.length >= maxWords) {
              const lastPeriodIndex = chunk.lastIndexOf('.');
              if (lastPeriodIndex !== -1) {
                  allChunks.push(chunk.slice(0, lastPeriodIndex + 1).join(' '));
                  chunk = chunk.slice(lastPeriodIndex + 1);
              } else {
                  allChunks.push(chunk.join(' '));
                  chunk = [];
              }
          }
      }

      if (chunk.length) allChunks.push(chunk.join(' '));

      return allChunks;
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0,
              v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
      });
  }

  const handleDrop = async (files: File[]) => {
      setIsUploading(true);
      const file = files[0];
      const formData = new FormData();
      formData.append('files', file);

      const fileNameParts = file.name.split('.');
      const fileExtension = fileNameParts.pop()!;
      const fileNameWithoutExtension = fileNameParts.join('.');

      try {
          const response = await fetch('/api/file-parser', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              throw new Error("Failed to process files.");
          }

          const data = await response.json();
          const parsedText = data.files[0];

          const fileId = generateUUID();
          const uuid = generateUUID();
          const uniqueFileName = `${fileNameWithoutExtension}-x-${uuid}`;
          // Add the file details to Supabase
          const {data: insertResponse, error: insertResponseError} = await supabaseClient
              .from('files')
              .insert([
                  {
                      user_id: userId,
                      companion_id: companionId,
                      file_name: uniqueFileName,
                      file_extension: fileExtension,
                      file_content: parsedText,
                      file_id: fileId
                  },
              ]);

          if (insertResponseError) {
              console.error('Error uploading file to Supabase:', insertResponseError);
              return;
          }

          const chunks = splitTextByWordCount(parsedText, 550);
          console.log("Total Chunks:", chunks.length);
          setTotalChunks(chunks.length);

          // Update total_chunks in the files table
          await supabaseClient.from('files').update({ total_chunks: chunks.length, chunks_remaining: chunks.length }).eq('file_id', fileId).eq('user_id', userId);
          for (let index = 0; index < chunks.length; index++) {
              const chunk = chunks[index];

              // Request embedding from your API
              const embeddingResponse = await fetch('/api/generate-embeddings', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      message: chunk,
                  }),
              });

              if (!embeddingResponse.ok) {
                  console.error(`Error generating embedding for chunk ${index + 1}:`, await embeddingResponse.text());
                  continue; // Handle error accordingly
              }

              const embeddingData = await embeddingResponse.json();

              await supabaseClient.from('memories').insert({
                  companion_id: companionId,
                  content: `# ${chunk}`,
                  embeddings: embeddingData.embedding,
                  user_id: userId,
                  memory_name: `${fileNameWithoutExtension}.${fileExtension}`,
                  file_id: fileId
              });

              await supabaseClient
                  .from('files')
                  .update({ chunks_remaining: chunks.length - (index + 1) })
                  .eq('file_id', fileId)
                  .eq('user_id', userId);

              await delay(200);
          }

          const { error: updateError } = await supabaseClient
              .from('files')
              .update({ has_uploaded: true })
              .eq('file_id', fileId)
              .eq('user_id', userId);

          if (updateError) {
              console.error('Error updating file status in Supabase:', updateError);
          }

          setIsUploading(false);
          setUploadedFile({
              file_name: fileNameWithoutExtension,
              file_extension: fileExtension,
              file_content: parsedText,
              companion_id: companionId,
          });
          setIsFileDropzoneOpen(false);
      } catch (error) {
          console.error("Error uploading and processing files:", error);
      }
  };

  useEffect(() => {
      if (isUploading) {
          const intervalId = setInterval(async () => {
              const { data } = await supabaseClient
                  .from('files')
                  .select('chunks_remaining')
                  .eq('file_id', fileId)
                  .eq('user_id', userId);

              if (data && data.length > 0) {
                  setChunksRemaining(data[0].chunks_remaining);
              }
          }, 2000);

          return () => clearInterval(intervalId);
      }
  }, [isUploading, supabaseClient, fileId]);

  const progressPercentage = ((totalChunks - chunksRemaining) / totalChunks) * 100;

  return (
    <Dropzone
    onDrop={handleDrop}
    maxSize={120 * 1024 * 1024}
    accept={{
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/html': ['.html', '.htm'],
    'application/json': ['.json'],
    'application/vnd.oasis.opendocument.text': ['.odt'],
    'application/pdf': ['.pdf'],
    'application/rtf': ['.rtf'],
    'text/plain': ['.txt'],
    'application/xml': ['.xml'],
    'text/markdown': ['.md']
    }}
    maxFiles={1}
      {...props}
    >
      <Group position="center" spacing="xl" style={{ minHeight: rem(220), pointerEvents: 'none' }}>
      {isUploading ? (
          <Flex direction="column" align="center">
              <Text align="center">Uploading...</Text>
              <Progress value={progressPercentage} style={{ width: '80%', marginTop: '10px' }} animate />
          </Flex>
      ) : (
        <>
        <Dropzone.Accept>
          <IconFileUpload
            size="3.2rem"
            stroke={1.5}
            color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size="3.2rem"
            stroke={1.5}
            color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFileUpload size="3.2rem" stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag files here or select them manually
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Attach as many files as you like. Each file will be appended on a new line of your memory file.
          </Text>
          <List size="sm" color="dimmed" withPadding mt={10}>
            <List.Item>Upload limit: 20mb</List.Item>
            <List.Item>Supported files: DOC, DOCX, HTML/HTM, JSON, MDX/MD, ODT, PDF, RTF, TXT, XML </List.Item>
          </List>
        </div>
        </>
      )}
      </Group>
    </Dropzone>
  );
}

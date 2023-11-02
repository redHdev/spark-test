import { Group, Text, List, useMantineTheme, rem, Flex, Button, Alert } from '@mantine/core';
import { IconFileUpload, IconFile, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useState } from 'react';
import { useCompanion } from '../../../context/MemoriesContext';

export default function FileDropzone(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { setMemories, setIsFileDropzoneOpen } = useCompanion();
  const [tempFiles, setTempFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (files: File[]) => {
    setUploadedFiles(files);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/file-parser', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process files.");
      }

      const data = await response.json();
      setTempFiles(data.files);
    } catch (error) {
      console.error("Error uploading and processing files:", error);
      setError("Error uploading and processing files. Please try again.");
    }
  };

  const handleSave = () => {
    setMemories(tempFiles);
    setTempFiles([]);
    setIsFileDropzoneOpen(false);
  }

  return (
    <>
    <Dropzone
    onDrop={handleDrop}
    maxSize={20 * 1024 ** 2}
    accept={[".doc", ".docx", ".html", ".htm", ".json", ".md", ".mdx", ".odt", ".pdf", ".rtf", ".txt", ".xml"]}
    maxFiles={3}
      {...props}
    >
      <Group position="center" spacing="xl" style={{ minHeight: rem(220), pointerEvents: 'none' }}>
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
      </Group>
    </Dropzone>
    {uploadedFiles.map((file, index) => (
      <>
        <Flex align="center" key={index} style={{ marginTop: 15 }}>
          <IconFile style={{ marginRight: 10 }} />
          <div>
            <Text>{file.name}</Text>
            <Text size="xs" color="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
          </div>
        </Flex>
      </>
    ))}
    {error ? (
      <Alert title="Error" color="red" style={{ marginTop: '15px' }}>
        {error}
      </Alert>
    ) : (
      <Button onClick={handleSave} style={{ marginTop: '15px' }}>
        Add files to Memory
      </Button>
    )}
  </>
  );
}

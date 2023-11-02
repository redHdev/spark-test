import { Group, Text, List, useMantineTheme, rem, Flex, Button } from '@mantine/core';
import { IconFileUpload, IconFile, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCompanion } from '../../../context/MemoriesContext';

export default function ImgDropzone(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { setPfp, setIsImgDropzoneOpen, selectedCompanion } = useCompanion();
  const [tempFiles, setTempFiles] = useState<string>('');

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

      const data = await response.json();
      setTempFiles(data.files);
    } catch (error) {
      console.error("Error uploading and processing files:", error);
    }
  };

  const handleSave = async () => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const fileExtension = uploadedFiles[0].name.split('.').pop();
      const newFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `/companions/${newFileName}`;

      const { error } = await supabase.storage.from('spark-menu-bucket').upload(filePath, uploadedFiles[0]);

      if (error) {
        console.error('Error uploading image:', error);
        return;
      }

      if (selectedCompanion) {
        const { error } = await supabase
          .from('companions')
          .update({ pfp: newFileName })
          .eq('chatcode', selectedCompanion.chatcode);

        if (error) {
          console.error('Error updating companion pfp:', error);
          return;
        }
      }

      setPfp(newFileName);
      setIsImgDropzoneOpen(false);
    }
  };

  return (
    <>
    <Dropzone
      onDrop={handleDrop}
      maxSize={30 * 1024 ** 2}
      accept={[".png", ".jpg", ".jpeg"]}
      maxFiles={1}
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
            Drag image here or select manually
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Please upload your companions image.
          </Text>
          <List size="sm" color="dimmed" withPadding mt={10}>
            <List.Item>Upload limit: 30mb</List.Item>
            <List.Item>Supported formats: PNG, JPG/JPEG </List.Item>
          </List>
        </div>
      </Group>
    </Dropzone>
    {uploadedFiles[0] && (
      <Flex align="center" style={{ marginTop: 15 }}>
        <IconFile style={{ marginRight: 10 }} />
        <div>
          <Text>{uploadedFiles[0].name}</Text>
          <Text size="xs" color="dimmed">{(uploadedFiles[0].size / 1024 / 1024).toFixed(2)} MB</Text>
        </div>
      </Flex>
    )}
    <Button onClick={handleSave} style={{ marginTop: '15px' }}>
      Set image
    </Button>
  </>
  );
}

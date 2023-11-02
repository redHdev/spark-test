import React, { useState, useEffect } from 'react';
import { Paper, Text, Modal, Flex, Badge, Input, ScrollArea, List, Tooltip, ActionIcon, Box } from '@mantine/core';
import { IconTrash, IconFile, IconFileTypePpt, IconFileTypeTxt, IconFileTypePdf, IconFileTypeDocx, IconFileTypeXml, IconFileTypeXls, IconFileTypeHtml, IconUpload, IconArrowBack } from '@tabler/icons-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useCompanion } from '../../../context/MemoriesContext';
import FileDropzone from './file-dropzone';
import { useMediaQuery } from "@mantine/hooks";

interface FullScreenTextEditorProps {
  initialTextAlign?: 'left' | 'center' | 'right';
}

interface File {
  file_id: string;
  file_extension: string;
  file_name: string;
  created_at: string;
  companion_id: string;
  chunks_remaining: number;
  total_chunks:string;
  is_uploaded:boolean;
}

export default function Files({ initialTextAlign = 'left' }: FullScreenTextEditorProps) {
  
  const [files, setFiles] = useState<File[]>([]);
  const [keyRefresh, setKeyRefresh] = useState(0);
  const [showFileList, setShowFileList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const user = useUser();
  const userId = user?.id;
  const isMobile = useMediaQuery('(max-width: 726px)');
  const supabaseClient = useSupabaseClient();
  const { isFileDropzoneOpen, setIsFileDropzoneOpen, selectedCompanion, setShowFiles } = useCompanion();

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch(extension) {
      case 'pdf':
        return <IconFileTypePdf />;
      case 'doc':
      case 'docx':
        return <IconFileTypeDocx />;
      case 'txt':
        return <IconFileTypeTxt />;
      case 'html':
        return <IconFileTypeHtml />;
      case 'xls':
        return <IconFileTypeXls />;
      case 'xml':
        return <IconFileTypeXml />;
      case 'ppt':
        return <IconFileTypePpt />;
      default:
        return <IconFile />;
    }
  }

  useEffect(() => {
    async function fetchFiles() {
      if (!selectedCompanion) return;

      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('companion_id', selectedCompanion.companion_id);

      if (error) {
        console.error("Error fetching files:", error);
        return;
      }

      if (data) {
        console.log("Fetched files:", data);
        setFiles(data);
      }
    }

    fetchFiles();
  }, [selectedCompanion, isFileDropzoneOpen, supabaseClient]);

  const handleDeleteFile = async (fileId: string) => {
      try {
          // Delete the file from the 'files' table
          const { error: deleteFileError } = await supabaseClient
              .from('files')
              .delete()
              .eq('user_id', userId)
              .eq('file_id', fileId);

          if (deleteFileError) {
              console.error('Error deleting file from files table:', deleteFileError);
              return;
          }

          // Delete all memories with the same 'file_id' from the 'memories' table
          const { error: deleteMemoriesError } = await supabaseClient
              .from('memories')
              .delete()
              .eq('file_id', fileId);

          if (deleteMemoriesError) {
              console.error('Error deleting memories with the file id:', deleteMemoriesError);
              return;
          }

          // Update the local state
          setFiles(prevFiles => prevFiles.filter(file => file.file_id !== fileId));
  
      } catch (error) {
          console.error('There was an error deleting the file and associated memories:', error);
      }
  };

  const truncateText = (text: string, extension: string, isMobile: boolean): string => {
    if (isMobile && text.length > 16) {
      return `${text.slice(0, 16)}...${extension}`;
    }
    return `${text}.${extension}`;
  };

  const modifyFileName = (filename: string): string => {
    const index = filename.indexOf("-x-");
    if (index !== -1) {
      return filename.substring(0, index);
    }
    return filename;
  }

  return (
    <>
    <Paper style={{ display: 'flex', flexDirection: 'column', height: '100vh', width:'100%', padding:'0px', justifyContent: 'center', top:0, marginTop:'-2vh'}}>
        <Box>
        <Flex direction="column" style={{marginTop:'-10vh'}}>
        <Flex style={{width:'100%'}}>
          <ActionIcon variant="transparent" onClick={() => setShowFiles(false)}>
            <IconArrowBack size={20} />
          </ActionIcon>
          <Box mb="20px" w="100%" style={{ flexGrow: 1 }}>
          <Input
            placeholder="Search Memories"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          </Box>
        </Flex>
        <ScrollArea style={{ height: '70vh', width: '100%' }}>
            <List spacing="xs" size="sm" center>
            <Box onClick={() => setIsFileDropzoneOpen(true)} style={{cursor: 'pointer'}}>
              <List.Item icon={<IconUpload />}>
                <Box>
                  <Text>Upload a file</Text>
                  <Text size="sm" style={{opacity: 0.7, paddingRight:'5px'}}>
                    Upload a new file from your device
                  </Text>
                </Box>
              </List.Item>
            </Box>
            {showFileList &&
              <div key={keyRefresh}>
              {files
                .filter(file => file.file_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .reverse()
                .map((file) => {
                  const badgeColor: string = "blue";
                  const badgeText: string = "Uploaded";
                  return (
                    <List.Item
                      key={file.file_id}
                      icon={getFileIcon(file.file_name + "." + file.file_extension)}
                      style={{ paddingTop: '5px', borderTop: 'rgba(160,160,160,0.2)', marginTop: '5px', cursor: 'pointer' }}
                    >
                      <Box style={{ borderTop: '1px solid rgba(160,160,160,0.2)', padding: '6px', margin:'0 auto', display:'block', width: !isMobile ? '65vw' : '66vw' }}>
                        <Flex justify="space-between" align="center" style={{ width: !isMobile ? '65vw' : '66vw' }}>
                          <Flex direction="column" style={{flexGrow:1}}>
                          <Text>{truncateText(modifyFileName(file.file_name), file.file_extension, isMobile)}</Text>
                            <Badge color={badgeColor} style={{maxWidth:'85px'}}>
                              {badgeText}
                            </Badge>
                          </Flex>

                          <Flex direction="column" align="flex-end">

                            <Text size="sm" style={{ opacity: 0.7, whiteSpace: 'nowrap' }}>
                              {new Date(file.created_at).toLocaleString().split(',')[0]}
                            </Text>
                            <Tooltip label="Delete Memory" position="left">
                              <ActionIcon onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.file_id); }}>
                                <IconTrash size={20} />
                              </ActionIcon>
                            </Tooltip>
                          </Flex>
                        </Flex>
                      </Box>
                    </List.Item>
                  );
              })}
            </div>
          }
            </List>
          </ScrollArea>
        </Flex>
        </Box>
    </Paper>
    <Modal opened={isFileDropzoneOpen} onClose={() => setIsFileDropzoneOpen(false)} style={{zIndex:'99999'}}>
      <FileDropzone />
    </Modal>
    </>
  );
};


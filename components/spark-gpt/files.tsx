import React, { useState } from 'react';
import { Flex, Paper, Text, Button } from '@mantine/core';
import { IconSquarePlus, IconFileTypePdf, IconFileTypeDocx, IconFileUpload, IconTrash } from '@tabler/icons-react';

interface FileItem {
  fileName: string;
  fileIcon: typeof IconFileTypePdf | typeof IconFileTypeDocx;
}

const files: FileItem[] = [
  { fileName: 'example1.pdf', fileIcon: IconFileTypePdf },
  { fileName: 'example2.pdf', fileIcon: IconFileTypePdf },
  { fileName: 'example3.docx', fileIcon: IconFileTypeDocx },
  { fileName: 'example4.docx', fileIcon: IconFileTypeDocx },
];

interface PaperStyleProps {
  width: string;
  height: string;
  display: string;
  flexDirection: "column";
  alignItems: "center";
  justifyContent: "center";
  border?: string;
  padding: string;
  boxShadow?: string;
}

const UploadsComponent: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  const filesCount = files.length;

  const handleUseFile = () => {
    if (selectedFileIndex !== null) {
      setActiveFileIndex(selectedFileIndex);
      setSelectedFileIndex(null);
    }
  };

  const fileUploadMessage = () => {
    if (filesCount === 0) {
      return "You currently do not have any files uploaded. Upload your docx, pdf or txt to open them in your chatbot!";
    } else {
      return `You currently have ${filesCount}/4 files uploaded`;
    }
  };

  return (
    <div style={{ padding: '5vh 5vw' }}>
      <Text align="center" size="xl" style={{ marginBottom: '2vh' }}>
        Uploads
      </Text>
      <Text align="center" size="sm" style={{ marginBottom: '4vh' }}>
        {fileUploadMessage()}
      </Text>

      <Flex style={{ gap: '2vw', marginBottom: '5vh' }}>
      <Button
        variant="outline"
        leftIcon={<IconFileUpload size={20} />}
        style={{ flex: 1 }}
        disabled={selectedFileIndex === null}
        onClick={handleUseFile}
      >
        Use file
      </Button>
        <Button
          color="red"
          variant="outline"
          leftIcon={<IconTrash size={20} />}
          style={{ flex: 1 }}
          disabled={selectedFileIndex === null}>
          Remove file
        </Button>
        <Button
          color="blue"
          leftIcon={<IconSquarePlus size={20} />}
          style={{ flex: 1 }}>
          Upload file
        </Button>
      </Flex>

      <Flex wrap="wrap" justify="space-between" style={{ gap: '2vh' }}>
        {files.map((file, index) => {
          const FileIconComponent = file.fileIcon;

          let border = undefined;
          let boxShadow = undefined;
          if (index === activeFileIndex) {
            border = '2px solid blue';
            boxShadow = '0px 0px 10px 0px blue';
          } else if (index === selectedFileIndex) {
            border = '2px solid green';
          }

          const paperStyles: PaperStyleProps = {
            width: '135px',
            height: '135px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: border,
            padding: '2vh 0',
            boxShadow: boxShadow
          };

          return (
            <Paper
              key={index}
              shadow="xs"
              style={paperStyles}
              onClick={() => setSelectedFileIndex(index === selectedFileIndex ? null : index)}
            >
              <FileIconComponent size={70} style={{ marginBottom: '1vh' }} />
              <Text align="center" size="sm" style={{padding:'3px'}}>
                {file.fileName}
              </Text>
            </Paper>
          );
        })}
      </Flex>
    </div>
  );
};

export default UploadsComponent;

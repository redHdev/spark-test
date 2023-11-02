import React, { useState, useEffect } from 'react';
import { Paper, Text, Modal, Button, Flex, Loader, Input, ScrollArea, List, Tooltip, ActionIcon, Box } from '@mantine/core';
import { IconFileText, IconTrash, IconUpload, IconCheck, IconChevronUp, IconChevronDown, IconArrowBack, IconPlus } from '@tabler/icons-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useCompanion } from '../../../context/MemoriesContext';
import FileDropzone from './dropzone';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { useMediaQuery } from "@mantine/hooks";

interface FullScreenTextEditorProps {
  initialTextAlign?: 'left' | 'center' | 'right';
}

interface Memory {
  id: string;
  memory_name: string;
  content: string;
  created_at: string;
  companion_id: string;
}

export default function FullScreenTextEditor({ initialTextAlign = 'left' }: FullScreenTextEditorProps) {
  const content =
  'Click to write your memory...';
  const [text, setText] = useState(content);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentMemoryId, setCurrentMemoryId] = useState<string | null>(null);
  const [keyRefresh, setKeyRefresh] = useState(0);
  const [showMemoriesList, setShowMemoriesList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showIcon, setShowIcon] = useState(false);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const user = useUser();
  const userId = user?.id;
  const isMobile = useMediaQuery('(max-width: 726px)');
  const [controlsVisible, setControlsVisible] = useState(false);
  const supabaseClient = useSupabaseClient();
  const { isFileDropzoneOpen, setIsFileDropzoneOpen, selectedCompanion, setSelectedMemory, setShowTextEditor, memoryUploads } = useCompanion();
  const [editedMemoryTitle, setEditedMemoryTitle] = useState('');
  const companionId = selectedCompanion.companion_id;
  const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link,
        Superscript,
        SubScript,
        Highlight,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: text, // Use the text state instead of content constant
      onBlur: ({ editor }) => { setText(editor.getHTML()); }
  });

  useEffect(() => {
    const content = editor?.getHTML() || '';
    const textContent = new DOMParser().parseFromString(content, 'text/html').body.textContent || '';
    setCharacterCount(textContent.length);
  }, [editor?.getHTML()]);

  useEffect(() => {
    if (characterCount > 5000) {
      const content = editor?.getHTML() || '';
      const textContent = new DOMParser().parseFromString(content, 'text/html').body.textContent || '';
      const limitedText = textContent.substring(0, 5000);
      editor?.chain().setContent(limitedText).run();
    }
  }, [characterCount, editor]);

  let charColor = 'black';
  if (characterCount > 4800 && characterCount <= 4950) {
    charColor = 'orange';
  } else if (characterCount > 4950) {
    charColor = 'red';
  }

  const fetchMemories = async () => {
    try {
        const { data, error } = await supabaseClient
            .from('memories')
            .select('*')
            .eq('user_id', user?.id)
            .eq('companion_id', companionId)
            .or('file_id.is.null,file_id.eq.' + '');

        if (error) {
            console.log('Error fetching companions:', error);
            return;
        }

      if (data) {
        setMemories(data);
        console.log('Successfully fetched companions:', data);
      }
    } catch (err) {
      console.log('There was an error:', err);
    }
  };

  const getEmbeddings = async (message: string) => {
    const response = await fetch('/api/generate-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to get embeddings');
    }

    const data = await response.json();
    return data.embedding;
  };


  const handleNewMemory = async () => {
    const newMemory = {
      content: "Click to write your memory...",
      memory_name: "New memory",
      companion_id: selectedCompanion.companion_id,
      user_id: userId
    };

    const response = await supabaseClient
      .from('memories')
      .insert([newMemory]);

    const data = response.data as Memory[] | null;
    const error = response.error;

    await fetchMemories();
    if (error) {
      console.error('Error creating new memory:', error);
      setShowEditor(false);
    } else if (data && data.length > 0) {
      setText(newMemory.content);
      setEditedMemoryTitle(newMemory.memory_name);
      setMemories(prevMemories => [...prevMemories, data[0]]);
      setCurrentMemoryId(data[0].id);
      setEditedMemoryTitle(data[0].memory_name);
      handleSaveMemory();
      setKeyRefresh(prev => prev + 1);
      setShowMemoriesList(false);
    }
  };

  useEffect(() => {
      if (!showMemoriesList) {
          setShowMemoriesList(true);
      }
  }, [showMemoriesList]);

  const handleSaveMemory = async () => {
      if (!currentMemoryId) return;
      const plainText = text;

      const { error } = await supabaseClient
        .from('memories')
        .update({ content: plainText })
        .eq('id', currentMemoryId);

      if (error) {
        console.error('Error saving memory:', error);
      }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!currentMemoryId) return;
    const { error } = await supabaseClient
      .from('memories')
      .update({ memory_name: newTitle })
      .eq('id', currentMemoryId);

    if (error) {
      console.error('Error updating memory title:', error);
    } 
  };

  useEffect(() => {
    handleSaveMemory();
  }, [text]);

  useEffect(() => {
    if (user?.id) {
      fetchMemories();
    }
  }, [user?.id]);

  const handleErase = () => {
    setModalVisible(true);
  };

  const handleConfirmErase = () => {
    setText('');
    setModalVisible(false);
  };

  const handleCancelErase = () => {
    setModalVisible(false);
  };

  const handleMemoryClick = (memory: Memory) => {
      setSelectedMemory(memory);
      setCurrentMemoryId(memory.id);
      setEditedMemoryTitle(memory.memory_name);

      let contentToSet = memory.content;
      if (contentToSet.startsWith('# ')) {
          contentToSet = contentToSet.slice(2);
      }

      setText(contentToSet);

      if (editor) {
          editor.chain().setContent(contentToSet).run();
      }
      setShowEditor(true);
  };

  useEffect(() => {
      if (editor) {
          editor.chain().setContent(text).run();
      }
  }, [text]);

  const handleBackClick = async () => {
      setIsSaving(true);
      try {
          const embedding = await getEmbeddings(text);
          const prefixedText = text.startsWith('#') ? text : `# ${text}`;
          const plainText = prefixedText;

          if (currentMemoryId) {
              const { error } = await supabaseClient
                  .from('memories')
                  .update({
                      content: plainText,
                      memory_name: editedMemoryTitle,
                      embeddings: embedding
                  })
                  .eq('id', currentMemoryId);

              if (error) {
                  console.error('Error updating memory:', error);
              }
          }

          setShowEditor(false);
          await fetchMemories();

      } catch (error) {
          console.error(error);
      } finally {
          setIsSaving(false);
      }
  };

  const openFileDropzoneModal = () => {
    setIsFileDropzoneOpen(true);
  };

  useEffect(() => {
      if (memoryUploads.length > 0) {
          const newContent = memoryUploads.join("\n\n");
          setText(prevText => `${prevText}\n\n${newContent}`);
      }
  }, [memoryUploads]);

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabaseClient
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) {
        console.error('Error deleting memory:', error);
        return;
      }
      setMemories(prevMemories => prevMemories.filter(memory => memory.id !== memoryId));
    } catch (error) {
      console.error('There was an error deleting the memory:', error);
    }
  };

  const handleTitleSave = async () => {
    handleTitleChange(editedMemoryTitle);
  };

  useEffect(() => {
    editor?.on('update', ({ editor }) => {
      setText(editor.getHTML());
    });
  }, [editor]);

  const truncateText = (text: string, isMobile: boolean): string => {
    if (isMobile && text.length > 16) {
      return `${text.slice(0, 16)}...`;
    }
    return text;
  };

  const stripHtml2 = (html: string): string => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
  };

  const truncateTextDesc = (content: string, isMobile: boolean): string => {
      let cleanedContent = stripHtml2(content);

      if (cleanedContent.startsWith('# ')) {
          cleanedContent = cleanedContent.slice(2);
      }

      if (isMobile && cleanedContent.length > 16) {
          return `${cleanedContent.slice(0, 16)}...`;
      } else if (!isMobile && cleanedContent.length > 85) {
          return `${cleanedContent.slice(0, 85)}...`;
      }

      return cleanedContent;
  };


  return (
    <>
    <Paper style={{ display: 'flex', flexDirection: 'column', height: '100vh', width:'100%', padding:'0px', justifyContent: 'center', top:0, marginTop:'-4vh'}}>
      {!showEditor ? (
        <Box>
        <Flex direction="column" style={{marginTop:'-10vh'}}>
        <Flex style={{width:'100%'}}>
          <ActionIcon variant="transparent" onClick={() => setShowTextEditor(false)}>
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
            <Box onClick={handleNewMemory} style={{cursor: 'pointer'}}>
              <List.Item icon={<IconPlus />}>
                <Box>
                  <Text>Create a new memory</Text>
                  <Text size="sm" style={{opacity: 0.7, paddingRight:'5px'}}>
                    Write a new memory from scratch or upload files
                  </Text>
                </Box>
              </List.Item>
            </Box>
            {showMemoriesList &&
              <div key={keyRefresh}>
                {memories
                  .filter(memory => memory.memory_name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .reverse()
                  .map((memory) => (
              <List.Item
                key={memory.id}
                icon={<IconFileText />}
                onClick={() => handleMemoryClick(memory)}
                style={{ paddingTop: '5px', borderTop: 'rgba(160,160,160,0.2)', marginTop: '5px', cursor: 'pointer' }}
              >
                <Box style={{ borderTop: '1px solid rgba(160,160,160,0.2)', padding: '6px', margin:'0 auto', display:'block', width: !isMobile ? '65vw' : '66vw' }}>
                  <Flex justify="space-between" align="center" style={{ width: !isMobile ? '65vw' : '66vw' }}>

                    <Flex direction="column" style={{flexGrow:1}}>
                      <Text>{truncateText(memory.memory_name, isMobile)}</Text>
                      <Text size="sm" style={{ opacity: 0.7 }}>
                        {truncateTextDesc(memory.content, isMobile)}
                      </Text>
                    </Flex>

                    <Flex direction="column" align="flex-end">
                    <Text size="sm" style={{ opacity: 0.7, whiteSpace: 'nowrap' }}>
                      {new Date(memory.created_at).toLocaleString().split(',')[0]}
                    </Text>
                      <Tooltip label="Delete Memory" position="left">
                        <ActionIcon onClick={(e) => { e.stopPropagation(); handleDeleteMemory(memory.id); }}>
                          <IconTrash size={20} />
                        </ActionIcon>
                      </Tooltip>
                    </Flex>

                  </Flex>
                </Box>
              </List.Item>
            ))}
            </div>
          }
            </List>
          </ScrollArea>
        </Flex>
        </Box>
      ) : (
        <Box style={{marginTop:'-10vh'}}>
          <RichTextEditor
            editor={editor}
            style={{
              border: 'none',
              boxShadow: 'none',
              background: 'transparent',
              height: '90vh',
              paddingTop:'1vh',
              marginTop:'2vh'
            }}
          >
          <RichTextEditor.Toolbar sticky stickyOffset={60} >
          <Flex>
          {isSaving ? (
            <Loader color="gray" size="sm" style={{marginRight:'4px', transform:'translateY(5px)'}}/>
          ) : (
            <ActionIcon variant="default" size="lg" onClick={handleBackClick} style={{transform:'translate(-3px, 1px)', padding:'3px'}}>
              <Tooltip label="Save & exit" position="bottom"><IconArrowBack /></Tooltip>
            </ActionIcon>
          )}
          <Input
            placeholder="Memory Title"
            value={editedMemoryTitle}
            onChange={(e) => {
              setEditedMemoryTitle(e.currentTarget.value);
              setShowIcon(true);
            }}
            rightSection={showIcon && (
              <ActionIcon
                variant="transparent"
                onClick={handleTitleSave}
                style={{ marginRight: '-11px', transform: 'translateY(0px)' }}
              >
                <Tooltip label="Save Title" position="bottom">
                  <IconCheck size="1.25rem"/>
                </Tooltip>
              </ActionIcon>
            )}
            rightSectionWidth={40}
          />
          <Flex style={{right:0}}>
          <ActionIcon variant="transparent" onClick={openFileDropzoneModal}>
              <Tooltip label="Upload" position="bottom"><IconUpload /></Tooltip>
          </ActionIcon>
          <ActionIcon variant="transparent" onClick={handleErase}>
            <Tooltip label="Erase" position="bottom"><IconTrash /></Tooltip>
          </ActionIcon>
          </Flex>
          </Flex>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              {isMobile && (
                <ActionIcon
                  size="sm"
                  variant="default"
                  onClick={() => setControlsVisible(!controlsVisible)}
                >
                  {controlsVisible ? <IconChevronUp /> : <IconChevronDown />}
                </ActionIcon>
              )}
            </RichTextEditor.ControlsGroup>

            {controlsVisible && (
              <>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                  <RichTextEditor.Link />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>
              </>
            )}
            </RichTextEditor.Toolbar>
            <ScrollArea
              style={{height:'67.5vh', cursor:'text'}}
              onClick={() => editor?.view.focus()}
              scrollbarSize={4}
              scrollHideDelay={0}
            >
          <RichTextEditor.Content
            style={{
              border: 'none',
              height: 'auto',
              marginTop:'2vh',
              overflowY: 'auto'
            }}
            onKeyDown={e => {
                if (e.key === " ") {
                    editor?.chain().insertContent(" ").run();
                }
            }}
          />
          </ScrollArea>
        </RichTextEditor>
        <Box style={{position:'fixed', bottom:'6px'}}>
        <Text size="sm">
          <Flex>
            <Text style={{opacity:'0.78'}} color={charColor} size="sm">{characterCount}</Text>/5000 characters used
          </Flex>
        </Text>
        </Box>
          {isLoading && <Loader />}
          <Modal opened={modalVisible} onClose={() => setModalVisible(false)}>
            <Text align="center">Are you sure you want to erase the content from this memory?</Text>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop:'10px' }}>
              <Button color="gray" onClick={handleCancelErase} style={{marginLeft:'-4px'}}>Cancel</Button>
              <Button color="red" onClick={handleConfirmErase} style={{marginLeft:'4px'}}>Delete</Button>
            </div>
          </Modal>
        </Box>
      )}
    </Paper>
    <Modal opened={isFileDropzoneOpen} onClose={() => setIsFileDropzoneOpen(false)} style={{zIndex:'99999'}}>
      <FileDropzone />
    </Modal>
    </>
  );
};


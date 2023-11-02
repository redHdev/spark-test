import { useState } from 'react';
import { Text, useMantineTheme, Badge, Box, Group, Accordion, Button, createStyles, rem, Grid, Flex, Textarea } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import icons, { IconNames } from '../icons/icons';
import { IconDownload, IconBook, IconRobot } from '@tabler/icons-react';
import { lighten } from 'polished';

type DataType = {
  xTitle?: string,
  xDescription?: string,
  xIcon?: string,
  xType?: string,
  xAuthor?: string,
  xTags?: string[],
  iconColor?: string,
};

const useStyles = createStyles((theme) => ({
  control: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    fontSize: theme.fontSizes.sm,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
  },
}));


export default function Upload() {
  const theme = useMantineTheme();
  const tableColor = theme.colorScheme === 'dark' ? '#202125' : 'rgba(170,170,170,0.15)';
  const [data, setData] = useState<DataType | null>(null);
  const [pendingData, setPendingData] = useState<DataType | null>(null);
  const { classes } = useStyles();

  const onDrop = (files: File[]) => {
    if (files[0]) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (e.target) {
            const result = e.target.result;
            if (typeof result === 'string') { // Check if result is a string
              const json = JSON.parse(result);
              // Check the length of xTitle and xDescription
              if(json.xTitle && json.xTitle.length > 32) {
                json.xTitle = json.xTitle.substring(0, 32);
              }

              if(json.xDescription && json.xDescription.length > 100) {
                json.xDescription = json.xDescription.substring(0, 100);
              }

              setPendingData(json);
              setData(json);
            }
          }
        } catch (error) {
          console.error("Unable to parse JSON: ", error);
        }
      };

      reader.readAsText(files[0]);
    }
  };

  const uploadData = async () => {
    const res = await fetch('./api/upload-mod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pendingData)
    });

    if (res.ok) {
      setPendingData(null); // clear pendingData state
    } else if (res.status === 409) {
      console.error('Mode already exists');
    } else {
      console.error('Failed to save mode');
    }
  };

  const saveData = async () => {
    const res = await fetch('./api/saveMod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pendingData)
    });

    if (res.ok) {
      setPendingData(null); // clear pendingData state
    } else if (res.status === 409) {
      console.error('Mode already exists');
    } else {
      console.error('Failed to save mode');
    }
  };

  const renderIcon = (name: string | undefined, color: string | undefined) => {
    if (name === undefined) {
      return null;
    }

    let XIcon: any = null;
    let lighterIconColor: string | undefined = color;
    if (name in icons) {
      const iconName = name as IconNames;
      XIcon = icons[iconName];
      lighterIconColor = (typeof color === 'string') ? lighten(0.3, color) : color;
    }
    return (
      XIcon ? (
        <Box style={{backgroundColor: lighterIconColor, padding:'3%', borderRadius:'7px'}}>
          <XIcon size={32} color={color} />
        </Box>
      ) : (
          <div>Icon: {name} not found</div>
      )
    );
  }

  return (
    <Box sx={{right:'3%', top:'15%'}}>
    <Grid gutter="xs" justify="flex-start" >
      <Dropzone
        onDrop={onDrop}
        w="100%"
        h="15vh"
      >
      <IconDownload
        size={rem(50)}
        stroke={1.5}
        style={{float:'left'}}
      />
        <Text style={{float:'left', marginTop:'2.2vh', marginLeft:'2vw'}}>Drag and drop your file or click here</Text>
      </Dropzone>
      <Grid.Col span={6}>
       {data && (
         <Flex direction="column" justify="flex-start" style={{maxWidth:'20vw', marginTop:'0.3vh'}}>
         <Button onClick={uploadData} leftIcon={<IconBook />}>Upload to Public Library</Button>
         <Button variant="light" onClick={saveData} leftIcon={<IconRobot />} style={{marginTop:'5%'}}>Save to My Mods</Button>
         </Flex>
       )}
       </Grid.Col>
      <Grid.Col span={6}>
       {data && (
         <Textarea
           label="JSON Data"
           readOnly
           style={{width: "100%"}}
           minRows={15}
           value={JSON.stringify(data, null, 2)}
         />
       )}
       </Grid.Col>
       <Grid.Col span={6}>
       {data && (
         <Accordion chevronPosition="right" variant="contained" style={{marginTop:'4vh'}}>
         <Accordion.Item value={data.xTitle || 'Title missing!'}>
           <Accordion.Control className={classes.control}>
             <Group noWrap>
               {renderIcon(data.xIcon, data.iconColor)}
               <div>
                 <Text>{data.xTitle}</Text>
                 <Text size="sm" color="dimmed" weight={400}>
                   {data.xDescription}
                 </Text>
               </div>
             </Group>
           </Accordion.Control>
           <Accordion.Panel>
           <Grid gutter="0" style={{border:'1px solid rgba(160,160,160,0.08)', borderRadius:'7px'}}>
             <Grid.Col span={6}>
               <Flex direction="column" style={{height: '100%'}}>
                 <Box style={{backgroundColor: tableColor, padding: '10px'}}>
                   <Text size="sm"><strong>Mode</strong></Text>
                 </Box>
                 <Box style={{padding: '10px'}}>
                   <Text size="sm"><strong>Author</strong></Text>
                 </Box>
                 <Box style={{backgroundColor: tableColor, padding: '10px', height:'100%'}}>
                   <Text size="sm"><strong>Tags</strong></Text>
                 </Box>
                 </Flex>
               </Grid.Col>
               <Grid.Col span={6}>
                 <Flex direction="column" style={{height: '100%'}}>
                   <Box style={{backgroundColor: tableColor, padding: '10px'}}>
                   <Text size="sm">{data.xType}</Text>
                 </Box>
                 <Box style={{padding: '10px'}}>
                   <Text size="sm">{data.xAuthor}</Text>
                 </Box>
                 <Box style={{backgroundColor: tableColor, padding: '10px'}}>
                 {data.xTags && Array.isArray(data.xTags) && data.xTags.slice(0, 3).map((tag) => (
                   <Badge key={tag} color="teal">{tag}</Badge>
                 ))}
                 </Box>
                 </Flex>
               </Grid.Col>
             </Grid>
             <Text size="sm" mt="4vh">A preset for creating most written lessons and tutorials using just a word, subject or a more intricate, specified input. Thanks for the support so far guys!</Text>
           </Accordion.Panel>

         </Accordion.Item>
         </Accordion>
       )}
       </Grid.Col>
      </Grid>
    </Box>
  );
}

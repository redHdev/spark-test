import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { Input, Button, Container, Paper, Text, Badge, Image, Box, Title, Switch, Flex } from '@mantine/core';
import { IconDownload, IconPhotoFilled } from '@tabler/icons-react';

function ImageGen() {
    const [prompt, setPrompt] = useState<string>('');
    const [callcode, setCallcode] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageMod, setImageMod] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [useImageMods, setUseImageMods] = useState(false);

    const imageModsArray = [
        { url: '/imageMods/3d_render.jpg', title: '3D Render', prompt: '3D perspective view of ' },
        { url: '/imageMods/oil_painting.jpg', title: 'Oil Painting', prompt: 'Oil painting rendition of ' },
        { url: '/imageMods/monochrome.jpg', title: 'Monochrome', prompt: 'Black and white representation of ' },
        { url: '/imageMods/pixel_art.jpg', title: 'Pixel Art', prompt: 'Pixelated version of ' },
        { url: '/imageMods/retro.jpg', title: 'Retro', prompt: 'Vintage style portrayal of ' },
        { url: '/imageMods/sketch.jpg', title: 'Sketch', prompt: 'Sketch drawing of ' },
        { url: '/imageMods/abstract.jpg', title: 'Abstract', prompt: 'Abstract interpretation of ' },
        { url: '/imageMods/vaporwave.jpg', title: 'Vaporwave', prompt: 'Vaporwave aesthetic of ' }
    ];

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        if (name === "prompt") setPrompt(value);
        if (name === "callcode") setCallcode(value);
    };

    const handleImageClick = (prompt: string) => {
        setImageMod(prompt);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (callcode !== "douglasjackson69") {
            setErrorMessage("Invalid callcode!");
            return;
        }

        setErrorMessage(null);
        const finalPrompt = imageMod ? `${imageMod}${prompt}` : prompt;

        try {
            const response = await axios.post('/api/image-generator', { prompt: finalPrompt });
            const blobUrl = URL.createObjectURL(response.data);
            setImageUrl(blobUrl);
        } catch (error) {
            console.error('Error generating image:', error);
        }
    };

    return (
      <Container size="xl">
          <Flex>
              <Box style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                  <Title align="center" size="h2">Spark Imagen v1</Title>
                  <Badge style={{ marginLeft: '1em' }} variant="outline">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                          <IconPhotoFilled />
                          <Text style={{ marginLeft: '4.2px' }}>Beta</Text>
                      </div>
                  </Badge>
              </Box>
              <Box style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'start' }}>
              <Text size="sm" style={{ marginBottom: '1em' }}>
                  Enter a prompt to generate an image. Spark Imagen v1 is currently in private beta.
                  To use our image engine, please enter the code below or request a callcode from our Discord server. Thanks!
              </Text>
              <form onSubmit={handleSubmit}>
                     <Input
                        type="text"
                        name="prompt"
                        value={prompt}
                        onChange={handleInputChange}
                        placeholder="Enter your prompt..."
                        style={{ marginBottom: 10 }}
                      />
                      <Input
                        type="text"
                        name="callcode"
                        value={callcode}
                        onChange={handleInputChange}
                        placeholder="Enter a callcode..."
                        style={{ marginBottom: 20 }}
                      />
                      <Button type="submit" style={{ marginBottom: 10 }}>Generate</Button>
                    {errorMessage && <Text color="red" size="sm">{errorMessage}</Text>}
                  </form>
                  <Switch checked={useImageMods} onChange={() => setUseImageMods(!useImageMods)}
                      label="Use image mods" style={{ marginBottom: '1em' }} />

                  <Flex>
                  {imageModsArray.map(({ url, title, prompt }, index) => (
                      <Box key={index} style={{ textAlign: 'center', margin: '5px' }}>
                          <Text size="xs">{title}</Text>
                          <img
                              src={url}
                              alt={title}
                              onClick={() => handleImageClick(prompt)}
                              style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius:'7px',
                                  border: imageMod === prompt ? '2px solid green' : '2px solid transparent',
                                  cursor: useImageMods ? 'pointer' : 'default',
                                  filter: useImageMods ? 'none' : 'grayscale(100%)',
                                  opacity: useImageMods ? 1 : 0.5
                              }}
                          />
                      </Box>
                  ))}
                  </Flex>
              </Box>

              <Box style={{ marginTop: '1em' }}>
                  <Paper style={{ width: '100%', maxWidth: 300, padding:'15px' }}>
                      {imageUrl && <Image src={imageUrl} alt="Generated" style={{ width: '100%', marginBottom: '1em' }} />}
                  </Paper>
                  {imageUrl && <a href={imageUrl} download><Button leftIcon={<IconDownload />}>Download</Button></a>}
              </Box>
              </Flex>
          </Container>
      );
  }

  export default ImageGen;

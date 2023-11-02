import React, { useState, useEffect } from "react";
import { Button, Flex, Text, Paper, Divider } from "@mantine/core";
import LabInput from '../inputs/labInput';
import { useCompanion } from '../../context/MemoriesContext';
import { useActiveComponent } from '../../context/NavContext';
import Companions from "../spark-gpt/companions";

export default function Laboratory() {

  const { showCompanions, setShowCompanions } = useCompanion();
  const { openLab, setOpenLab } = useActiveComponent();
  const [activeButton, setActiveButton] = useState('');
  const [buttonText, setButtonText] = useState("Use our laboratory to make your own customizable chatbot experiences!");
  const [isLoading, setIsLoading] = useState(true);

  const handleButtonClick = (type: string) => {
    if (type === 'Characters') {
      if (activeButton === 'Characters') {
        setOpenLab(true);
      } else {
        setOpenLab(false);
        setShowCompanions(false);
        setActiveButton('Characters');
        setButtonText("Quickly create any character or persona in under 5 seconds by entering in what you want.");
      }
    } else {
      if (activeButton === 'Companions') {
        setShowCompanions(true);
      } else {
        setOpenLab(false);
        setShowCompanions(false);
        setActiveButton('Companions');
        setButtonText("Build a shareable companion bot using custom memories, prompts and uploaded files.");
      }
    }
  };

    useEffect(() => {
      const img = new Image();
      img.src = "general/laboratory.png";
      img.onload = () => setIsLoading(false);
    }, []);

    return (
      <>
          {isLoading ? (
            <>

            </>
          ) : (
    <>
      <Flex>
        {openLab ? (
          <LabInput />
        ) : (
          <>
            {!showCompanions ? (
              <Flex align="center" justify="center" direction="column" style={{ width: '100%', height:'100%', marginTop:'5.5vh'}}>
                <Paper shadow="sm" style={{padding:'20px'}} withBorder>
                  <img src="general/laboratory.png" alt="Add a shared companion!" style={{width:'300px'}}/>
                  <Divider />
                  <Flex direction='row' align="center" justify="center" style={{ width: '100%', height:'100%', marginTop:'20px'}} gap="sm">
                    <Flex direction="column" align="center">
                      <Button
                        size="lg"
                        onClick={() => handleButtonClick('Characters')}
                        variant={activeButton === 'Characters' ? "filled" : "default"}
                      >
                        Characters
                      </Button>
                    </Flex>
                    <Flex direction="column" align="center">
                      <Button
                        size="lg"
                        onClick={() => handleButtonClick('Companions')}
                        variant={activeButton === 'Companions' ? "filled" : "default"}
                      >
                        Companions
                      </Button>
                    </Flex>
                  </Flex>
                  <Text color="dimmed" size="sm" style={{marginTop:'7px', width:'300px', textAlign:'center'}}>{buttonText}</Text>
                </Paper>
              </Flex>
            ) : (
              <Companions />
            )}
          </>
        )}
      </Flex>
    </>
  )}
</>
  );
}

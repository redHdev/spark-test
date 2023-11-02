import React from 'react';
import { Center } from '@mantine/core';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const RotatingImage = styled.div`
  animation: ${rotate} 2s linear infinite;
  width: 50px;
  height: 50px;

`;

const Loader: React.FC = () => {
  return (
    <Center style={{ height: '80vh' }}>
      <RotatingImage>
        <img src="/loader/1.PNG" alt="Loader" style={{ width: '50px', height: '50px' }} />
      </RotatingImage>
    </Center>
  );
};

export default Loader;

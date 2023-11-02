import React, { useState, useEffect } from 'react';
import { usePrompt } from '../../context/PromptConfig';

const EmojiLoader: React.FC = () => {
  const [loaderStage, setLoaderStage] = useState(0);
  const [randomizedLoader, setRandomizedLoader] = useState('');

  const {promptConfig} = usePrompt();
  const backendMods = promptConfig?.backendMods;
  const xLoader = backendMods?.xLoader || getRandomDefaultEmojis();

  function getRandomDefaultEmojis() {
      const emojis = ["🚀", "🍕", "🌈", "🎉", "🎲", "🏆", "🎵", "🔔", "🎮", "💡", "📚", "🖥", "💼", "🌟", "🍀", "🎄", "📷", "🎥", "🎨", "🔑", "⌛", "💰", "🔒", "💎", "🌺", "🍄", "🔭", "📡", "🔋", "🔔"];
      const randomIndices: Set<number> = new Set();
      while (randomIndices.size < 3) {
        randomIndices.add(Math.floor(Math.random() * emojis.length));
      }
      return Array.from(randomIndices).map(i => emojis[i]).join('');
  }

  useEffect(() => {
    const randomizeOrder = (str: string) => {
      const arr = str.match(/./gu);
      if (arr) {
        for(let i = arr.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
      }
      return '';
    };

    if (typeof xLoader === "string") {
        setRandomizedLoader(randomizeOrder(xLoader));
    } else if (Array.isArray(xLoader)) {
        setRandomizedLoader(randomizeOrder(xLoader.join('')));
    }
  }, [xLoader]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoaderStage((prevStage) => (prevStage + 1) % 4);
    }, 300);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const renderLoader = () => {
    switch (loaderStage) {
      case 0:
        return '';
      case 1:
        return randomizedLoader.substring(0, 2);
      case 2:
        return randomizedLoader.substring(0, 4);
      case 3:
        return randomizedLoader;
      default:
        return '';
    }
  };

  return (
    <div>
      {renderLoader()}
    </div>
  );
};

export default EmojiLoader;

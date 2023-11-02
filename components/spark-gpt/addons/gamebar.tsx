import React from 'react';
import { Box, Flex, Image, Text } from '@mantine/core';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect, useRef } from 'react';
import { fetchGameState } from '../functions/useGetGameState';

type Item = {
    name: string;
    emoji: string;
    purpose: string;
    quantity: number;
};

type ShopItem = Item & {
    price: number;
};

interface GameState {
    xp: number;
    health: number;
    bankroll: number;
    bag: Item[];
    shop: ShopItem[];
}

interface BottomBarProps {
    gameState: GameState;
}

const GamebarBottom: React.FC<BottomBarProps> = () => {
    const [images, setImages] = useState<{ [key: string]: string }>({});
    const [gameState, setGameState] = useState<GameState | null>(null);
    const supabaseClient = useSupabaseClient();

    const [displayedXP, setDisplayedXP] = useState(0);
    const [displayedBankroll, setDisplayedBankroll] = useState(0);
    const xpRef = useRef(gameState?.xp ?? 0);
    const bankrollRef = useRef(gameState?.bankroll ?? 0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                  const imageNames = ['bag.png', 'wallet.png', 'xp.png', 'heart.png', 'heartempty.png', 'shop.png'];
                  const promises = imageNames.map(async (imageName) => {
                    try {
                        const { data: publicUrlData } = await supabaseClient
                            .storage
                            .from('spark-menu-bucket')
                            .getPublicUrl(`gamebar/${imageName}`);

                        return [imageName, publicUrlData.publicUrl];
                    } catch (error: any) {
                        if (typeof error.message === 'string') {
                            console.error(`Failed to get public URL for image settings/${imageName}:`, error.message);
                        } else {
                            console.error(`Failed to get public URL for image settings/${imageName}:`, error);
                        }
                        return [imageName, null];
                    }
                });

                const resolvedUrls = await Promise.all(promises);
                const imageUrls: { [key: string]: string } = {};

                for (const [imageName, imageUrl] of resolvedUrls) {
                    if (imageUrl) {
                        imageUrls[imageName as string] = imageUrl;
                    }
                }

                setImages(imageUrls);

            } catch (error) {
                console.log(error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchGameData = async () => {
            const path = window.location.pathname;
            const id = path.split('/chat/')[1];
            const result = await fetchGameState(id);
            setGameState(result.gameState);
        };
        fetchGameData();
        const intervalId = setInterval(fetchGameData, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            callback(start + Math.ceil(progress * (end - start)));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    useEffect(() => {
        if (gameState?.xp !== xpRef.current) {
            animateValue(displayedXP, gameState?.xp ?? 0, 500, value => {
                setDisplayedXP(value);
            });
            xpRef.current = gameState?.xp ?? 0;
        }
        if (gameState?.bankroll !== bankrollRef.current) {
            animateValue(displayedBankroll, gameState?.bankroll ?? 0, 500, value => {
                setDisplayedBankroll(value);
            });
            bankrollRef.current = gameState?.bankroll ?? 0;
        }
    }, [gameState]);

    const hearts = Array.from({ length: 5 }).map((_, idx) => {
        const health = gameState?.health ?? 0;
        if (idx < health) {
            return <Image src={images['heart.png']} width={20} height={20} alt="Full Heart" key={idx} />;
        }
        return <Image src={images['heartempty.png']} width={20} height={20} alt="Empty Heart" key={idx} />;
    });

    return (
        <>
        <Box style={{paddingBottom:'10px', marginBottom:'20px'}}>
        <Flex direction="row" justify="center">
        <Box
            style={{
                position: 'absolute',
                transform: 'translateY(-10px) rotate(45deg)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius:'11px',
                border: '4px solid #57ccff',
                background: 'radial-gradient(circle at center, #64dfff 0%, #40cfff 25%, #12c0ff 50%, #00bbff 75%, #00aeff 100%)'
            }}
        >
        <span style={{opacity:'1', color:'white', fontWeight:'bold', transform: 'rotate(-45deg)'}}>{displayedXP}</span>
        </Box>

        </Flex>
            <Box
                style={{
                    width:'100%',
                    padding:'7.5px',
                    borderTop:'1px solid rgba(160,160,160,0.75)'
                }}
            >
                <Flex direction="row" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Box display="flex" style={{left:'5px'}}>
                        {hearts}
                    </Box>

                    <Box display="flex" style={{right:'5px'}}>
                    <Box
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '100%',
                            border: '2px solid #ffcc57',
                            background: 'radial-gradient(circle at center, #ffdf64 0%, #ffcf40 25%, #ffc012 50%, #ffbb00 75%, #ffae00 100%)',
                            transform:'translateY(3px)'
                        }}
                    >

                    </Box>
                    <Text style={{fontWeight:'bold', transform:'translateY(-3px)'}}>${displayedBankroll}</Text>
                        <Image src={images['bag.png']} width={20} height={20} alt="Bag" />
                        <Image src={images['shop.png']} width={20} height={20} alt="Shop" />
                    </Box>
                </Flex>
            </Box>
         </Box>
        </>
    );
};

export default GamebarBottom;

import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const openaiEndpoint = 'https://api.openai.com/v1/completions';
const openaiApiKey = process.env.OPENAI_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const body = {
        model: 'gpt-3.5-turbo-instruct',
        prompt: `
        Return an icon from the list below based off this theme/character/idea: ${prompt}

        Do not say anything at all. Only return the name of a single icon from the list below which would probably fit the theme/character/idea the most.

        Icon list:


        History:

        ankh
        buildingCastle
        buildingChurch
        militaryAward
        medal
        trophy
        badge
        torii
        certificate
        idBadge


        Food:

        cherry
        lemon
        egg
        candy
        baguette
        beer
        bottle
        bowl
        cheese
        bread
        eggFried
        iceCream
        iceCream2
        lollipop
        milkshake
        mushroom
        pepper
        pizza
        cookie
        carrot
        mug
        coffee
        tea
        milk


        Lifestyle:

        bath
        cane
        bandage
        toiletPaper
        shoe
        sock
        shirt
        sofa
        armchair
        babyBottle
        babyCarriage
        umbrella
        mirror
        bulb
        candle
        cup
        lighter
        wallet
        clipboard
        compass
        cube
        gift
        lock
        lockOpen
        magnet
        mailbox
        pencil
        pot
        ruler
        scissors
        stethoscope
        tag
        tool
        thermometer
        bucket
        brush
        grill
        grillSpatula
        cooker
        microwave
        mug


        Technology:

        network
        code
        zoomPan
        settings
        brandLinkedin
        brandYcombinator
        deviceGamepad
        deviceGamepad2
        radar
        radio
        phone
        photo
        printer
        camera
        speakerphone
        headphones
        headset
        cameraSelfie
        polaroid
        deviceDesktop
        deviceLaptop
        deviceMobile
        drone


        Nature:

        plant
        flower
        leaf
        tree
        mountain
        seed
        meteor
        cactus
        clover
        feather
        plant2
        seeding


        Weather:

        cloudFog
        cloudRain
        cloudSnow
        sunrise
        sunset2
        haze
        snowflake
        storm
        tornado
        temperature
        temperatureCelsius
        temperatureFahrenheit
        wind


        Shapes:

        square
        circleDot
        cylinder
        cone
        hexagon
        pyramid
        spade
        triangle
        diamond
        dice
        variable
        puzzle
        puzzle2


        Animals:

        bat
        fish
        butterfly
        spider
        cat
        deer
        dog
        fishBone
        pig


        Transport:

        car
        bus
        helicopter
        motorbike
        plane
        train
        truck
        bike
        sailboat
        sailboat2
        submarine
        speedboat
        moped
        parachute
        tank
        bulldozer
        camper
        crane
        engine
        firetruck
        forklift
        tractor
        trolley
        sleigh


        Sports & Activity:

        skateboarding
        barbell
        golf
        helmet
        iceSkating
        jumpRope
        karate
        kayak
        pingPong
        pool
        scubaMask
        swimming
        bow
        chessKnight
        chessKing
        chessBishop
        chessQueen
        chess
        chessRook
        sportBillard
        targetArrow


        Learning & Education:

        book
        pen
        scale
        brain
        businessPlan
        movie
        gizmo
        map2
        abc
        palette
        peace
        star


        House & Household:

        door
        fridge
        hammer
        window
        flask
        flame
        hourglass
        link
        mask
        moonStars
        note
        flare
        flag
        frame


        Health & Medical:

        bath
        cane
        bandage
        dental
        dna
        disabled
        eyeglass
        faceMask
        flask2
        fall
        heartbeat
        nurse
        smoking
        thermometer
      `,
        max_tokens: 10,
        temperature: 0.4
    };

    const headers = {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
    };

    try {
        const openaiResponse = await axios.post(openaiEndpoint, body, { headers });
        const completionText = openaiResponse.data?.choices?.[0]?.text?.trim() || '';
        return res.send(completionText);
    } catch (error) {
        console.error('Error generating GPT response:', error);
        return res.status(500).send('OpenAI API call failed');
    }
}

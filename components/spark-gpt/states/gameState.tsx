
type Item = {
    name: string;
    emoji: string;
    purpose: string;
    quantity: number;
};

type ShopItem = Item & {
    price: number;
};

export const gameStateIm = {
    xp: 0,
    health: 5,
    bankroll: 20,
    bag: [] as Item[],
    shop: [
        {
            name: "Flashlight",
            emoji: "🔦",
            purpose: "Lights up dark areas",
            quantity: 5,
            price: 5
        }
    ] as ShopItem[]
};

export const functions = [
    {
        name: "addToWallet",
        description: "Add an amount to the wallet",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number" }
            },
            required: ["amount"]
        }
    },
    {
        name: "addToXP",
        description: "Add experience points",
        parameters: {
            type: "object",
            properties: {
                points: { type: "number" }
            },
            required: ["points"]
        }
    },
    {
        name: "modifyHealth",
        description: "Modify the health value",
        parameters: {
            type: "object",
            properties: {
                value: { type: "number" }
            },
            required: ["value"]
        }
    },
    {
        name: "addItemToBag",
        description: "Add an item to the bag",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string" },
                emoji: { type: "string" },
                purpose: { type: "string" },
                quantity: { type: "number" }
            },
            required: ["name", "emoji", "purpose", "quantity"]
        }
    },
    {
        name: "addItemToShop",
        description: "Add an item to the shop",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string" },
                emoji: { type: "string" },
                purpose: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" }
            },
            required: ["name", "emoji", "purpose", "quantity", "price"]
        }
    }
];

export function handleFunctionCall(funcName: string, args: any, fetchedGameState: any): any {
    const updatedState = { ...fetchedGameState };

    switch (funcName) {
        case 'addToWallet':
            updatedState.bankroll += args.amount;
            break;
        case 'addToXP':
            updatedState.xp += args.points;
            break;
        case 'modifyHealth':
            updatedState.health += args.value;
            break;
        case 'addItemToBag':
            updatedState.bag.push(args);
            break;
        case 'addItemToShop':
            updatedState.shop.push(args);
            break;
    }
    return updatedState;
}

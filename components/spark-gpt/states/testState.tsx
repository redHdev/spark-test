export const testStateIm = {
    correct: 0,
    incorrect: 0
};

export const functions = [
    {
        name: "correct",
        description: "Increment correct by 1",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number" },
            },
            required: ["amount"]
        }
    },
    {
        name: "incorrect",
        description: "Increment incorrect by 1",
            parameters: {
                type: "object",
                properties: {
                    amount: { type: "number" },
                },
                required: ["amount"]
        }
    }
];

export function handleTestFunctionCall(funcName: string, args: any, fetchedTestState: any): any {
    const updatedState = { ...fetchedTestState };

    switch (funcName) {
        case 'correct':
            updatedState.correct += args.amount;
            break;
        case 'incorrect':
            updatedState.incorrect += args.amount;
            break;
    }
    return updatedState;
}

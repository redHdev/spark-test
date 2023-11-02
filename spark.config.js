const sparkConfiguration = {
    main: {
        headerTitle: "My App", // heading title of the app found in the <head> tags
        navbarTitle: 'My App', // title found in the navbar (maximum of 7 characters recommended)
        chatboxTitle: "myGPT", // title that shows on the chatbox (where the user types into)
        removeDarkMode: false, // removes the ability to change light mode to dark mode
        darkModeOnly: false, // sets the whole platform to dark mode and cannot be changed back to light mode by the user
        colorScheme: 'default', // default = blue. You can change it to any of the colors here to change the platforms blue accents: dark, gray, pink, red, orange, yellow, lime, green, teal, cyan, violet, grape
        removeStarterPacks: false, // removes the character mod starter packs from being offered to the new user
        cloudPlayOnly: true, // disables the ability to download character mods (not companions) and instead only uses cloud play (using character mods directly from the library)
        // DONE
        websiteLink: 'https://example.com', // set to your own domain/subdomain || if running locally set to 'http://localhost:3000'
        removeSearchbar: true, // removes the library search bar that is inside the navbar
    },

    // Admin account
    admin: {
        isRoleActive: true, // set if the role for the account type should be available or not to new users (recommended that only a couple people have access to this role)
        codeOnlyAccess: true, // set if the role can only be accessed by new users through matching an input with the moderator_code found in Supabase that you made in the account_type_setup table
        roleTitle: 'admin', // the title of the account type which is shown to those who login for the first time
        startWhere: 'chatbot', // where this account type start in the platform. (chatbot, companions, library or laboratory)
        // DONE
        library: true, // hides the Library component from being accessed by the account type
        // DONE
        settings: true,  // hides the Settings component from being accessed by the account type
        // DONE
        history: true,  // hides the History component from being accessed by the account type
        // DONE
        laboratory: true,  // hides the Laboratory component from being accessed by the account type
        // DONE
        createCompanions: true, // disables the ability to create companions for the account type
        // DONE
        getCompanions: true, // disables the ability to share companions via chatcode for the account type
        // DONE
    },

    // Moderator account
    moderator: {
        isRoleActive: true, // set if the role for the account type should be available or not to new users (teacher, employer, manager etc.)
        codeOnlyAccess: true, // set if the role can only be accessed by new users through matching an input with the moderator_code found in Supabase that you made in the account_type_setup table
        roleTitle: 'moderator', // the title of the account type which is shown to those who login for the first time
        startWhere: 'chatbot', // where this account type start in the platform. (chatbot, companions, library or laboratory)
        // DONE
        library: true, // hides the Library component from being accessed by the account type
        // DONE
        settings: true,  // hides the Settings component from being accessed by the account type
        // DONE
        history: true,  // hides the History component from being accessed by the account type
        // DONE
        laboratory: true,  // hides the Laboratory component from being accessed by the account type
        // DONE
        createCompanions: true, // disables the ability to create companions for the account type
        // DONE
        getCompanions: true, // disables the ability to share companions via chatcode for the account type
        // DONE
    },

    // User account
    user: {
        roleTitle: 'user', // the title of the account type which is shown to those who login for the first time (student, employee etc.)
        startWhere: 'companions', // where this account type start in the platform. (chatbot, companions, library or laboratory)
        // DONE
        library: true, // hides the Library component from being accessed by the account type
        // DONE
        settings: false,  // hides the Settings component from being accessed by the account type
        // DONE
        history: false,  // hides the History component from being accessed by the account type
        // DONE
        laboratory: false,  // hides the Laboratory component from being accessed by the account type
        // DONE
        createCompanions: false, // disables the ability to create companions for the account type
        // DONE
        getCompanions: true, // disables the ability to share companions via chatcode for the account type
        // DONE
    },

    // Settings from the settings page that accounts can use
    settings: {
        chatbotTab: {
            adventure: true, // Turns the chatbot into an interactive choose-your-own adventure game.
            riddles: true, // Turns the chatbot into an interactive riddles game.
            aSCII: true, // Makes the chatbot return ASCII art with every prompt.
            recipe: true, // Transforms the chatbot into a cooking recipe creator.
            action: true, // Makes the chatbot also respond with adlibs for more immersive interactions.
            trivia: true, // Modifies the chatbot to become a trivia machine.
            hardsetEmotion: true, // Use this to hardset a specific emotion to the chatbot.
            emotionalSentiment: true, // Makes the chatbot respond with an emoji at the bottom of each message to display their current emotion.
            impressionReadings: true, // Makes the chatbot respond with a 🟥, 🟧 or 🟩 at the bottom of each message to display its impression of the user.
            forceEmojis: true, // Forces the chatbot to use emojis if the mod it uses does not already use them.
        },
        tuningTab: {
            triadTraits: true, // Set the light triad vs dark triad personality traits in the chatbot.
            politicalBias: true, // Set a political bias to the chatbot for a dynamic personality tuning.
            disagreeableness: true, // Higher level will make the chatbot more disagreeable and debate-worthy.
            sarcasm: true, // Higher level will make the chatbot more sarcastic in its responses.
        },
        languageTab: {
            primaryLanguage: true, // Primary Language for the chatbot.
            secondaryLanguage: true, // Secondary Language, where the ai chatbot responds the same message twice but in 2 different languages (the primary and secondary).
        },
    },

    // AI Model
    aiModel: {
        aiMaxTokens: 500, // sets the maximum number of tokens the AI can respond with (tokens are special characters or pieces of words like "fan", "ily")
        aiTemperature: 0.6, // sets the randomness of the responses (GPT)
    },

    // Subscription
    subscription: {
        isSubscriptionOn: false, // turns on or off the subscription features of the platform (makes it free for use)
        subCloudPlay: true, // enables subscription to popup when a user tries to use cloud play
        subLaboratory: true, // enables subscription to popup when a user tries to use the laboratory
        subMaxTenMods: true, // enables subscription to popup when a user tries to download more character mods while already having 10 downloaded
    },

    // Announcement
    announcement: {
        sidebarAnnouncement: false,
        // DONE
        sidebarAnnouncementTag: 'New update',
        sidebarAnnouncementTitle: 'V3 - Companions',
        sidebarAnnouncementDescription:'Create your own shareable chatbot companion using your character mods and custom memories.',
        sidebarAnnouncementButtonName: 'Visit blog',
        sidebarAnnouncementButtonLink: 'https://sparkengine.ai/blog/introducing-sparkgpt-v3-companions-update'
    },

    // Page, tab and widget descriptions
    descriptions: {
      // Descriptions
        searchbarPlaceholder:'Search the library...',
        createCompanionDescription: 'Set up a shareable chatbot using your character mods and write memories to it using text or files.',
        laboratoryTitle:'Create a Mod!',
        laboratoryInputPlaceholder: 'A character from... that does...',
        laboratoryDescription: 'Being a creator for Spark Engine has never been easier. Simply enter in what you want and our AI will do all the work for you!',
      // Rename tabs
        renameCompanionsTab:'Companions',
        renameLaboratoryTab:'Laboratory',
        renameLibraryTab:'Library',
        renameSparkGPTTab:'SparkGPT',

    },

    // Enable Signin Options
    signInProviders: {
      // set a provider to true to make the platform use it as a sign-in option for users (make sure to set up the provider in your Supabase database)
        google: true,
        apple: false,
        facebook: false,
        twitter: false,
        github: false,
        azure: false,
        bitbucket: false,
        linkedin: false,
        discord: false,
        gitlab: false,
        keycloak: false,
        notion: false,
        slack: false,
        spotify: false,
        twitch: false,
        workos: false,
    }
}

module.exports = sparkConfiguration;

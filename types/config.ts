export interface SparkConfigType {
      main: {
        headerTitle: string;
        navbarTitle: string;
        chatboxTitle: string;
        removeDarkMode: boolean;
        darkModeOnly: boolean;
        colorScheme: string;
        removeStarterPacks: boolean;
        cloudPlayOnly: boolean;
        websiteLink: string;
      };
      admin: {
        isRoleActive: boolean;
        codeOnlyAccess: boolean;
        roleTitle: string;
        startWhere: string;
        library: boolean;
        settings: boolean;
        history: boolean;
        laboratory: boolean;
        createCompanions: boolean;
        getCompanions: boolean;
      };
      moderator: {
        isRoleActive: boolean;
        codeOnlyAccess: boolean;
        roleTitle: string;
        startWhere: string;
        library: boolean;
        settings: boolean;
        history: boolean;
        laboratory: boolean;
        createCompanions: boolean;
        getCompanions: boolean;
      };
      user: {
        roleTitle: string;
        startWhere: string;
        library: boolean;
        settings: boolean;
        history: boolean;
        laboratory: boolean;
        createCompanions: boolean;
        getCompanions: boolean;
      };
      settings: {
        chatbotTab: {
          adventure: boolean;
          riddles: boolean;
          aSCII: boolean;
          recipe: boolean;
          action: boolean;
          trivia: boolean;
          hardsetEmotion: boolean;
          emotionalSentiment: boolean;
          impressionReadings: boolean;
          forceEmojis: boolean;
        };
        tuningTab: {
          triadTraits: boolean;
          politicalBias: boolean;
          disagreeableness: boolean;
          sarcasm: boolean;
        };
        languageTab: {
          primaryLanguage: boolean;
          secondaryLanguage: boolean;
        };
      };
      aiModel: {
        aiMaxTokens: number;
        aiTemperature: number;
      };
      subscription: {
        isSubscriptionOn: boolean;
        subCloudPlay: boolean;
        subLaboratory: boolean;
        subMaxTenMods: boolean;
      };
      announcement: {
        sidebarAnnouncement: boolean;
        sidebarAnnouncementTag: string;
        sidebarAnnouncementTitle: string;
        sidebarAnnouncementDescription: string;
        sidebarAnnouncementButtonName: string;
        sidebarAnnouncementButtonLink: string;
      };
      descriptions: {
        searchbarPlaceholder: string;
        createCompanionDescription: string;
        laboratoryTitle: string;
        laboratoryInputPlaceholder: string;
        laboratoryDescription: string;
        renameCompanionsTab: string;
        renameLaboratoryTab: string;
        renameLibraryTab: string;
        renameSparkGPTTab: string;
      };
  }

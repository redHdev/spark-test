import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Cookies from 'js-cookie';
import { Navbar, createStyles, getStylesRef, rem } from '@mantine/core';
import {
  IconLogout,
  IconBook,
  IconFlask,
  IconDeviceMobileMessage,
  IconUserCircle,
  IconMessageChatbot
} from '@tabler/icons-react';
import { useSidebarContext } from '../../context/SidebarOpen';
import { useActiveComponent } from '../../context/NavContext';
import { useCompanion } from '../../context/MemoriesContext';
import { useConfig } from '../../context/ConfigContext';
import UpdateCard from './updateCard';

interface Mod {
  id: string;
  selected: boolean;
  xTitle: string;
  xType: string;
  xId: string;
  xImage: string;
  xDescription: string;
  xProduct: string;
  xShowImpressionLevels?: string;
  xImpressionLevelRed?: string;
  xImpressionLevelGreen?: string;
  xShowEmotionalState?: string;
  xPrompt: string;
  xIcon: string;
  iconColor: string;
  xAuthor: string;
  xTags?: string[];
  value: string;
}

const useStyles = createStyles((theme) => ({
  header: {
    paddingBottom: theme.spacing.md,
    marginBottom: `calc(${theme.spacing.md} * 1.5)`,
    borderBottom: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  footer: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  link: {
    ...theme.fn.focusStyles(),
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: theme.fontSizes.sm,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,

      [`& .${getStylesRef('icon')}`]: {
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      },
    },
  },

  linkIcon: {
    ref: getStylesRef('icon'),
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
    marginRight: theme.spacing.sm,
  },

  linkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: 'none' }).background,
      color: theme.fn.variant({ variant: 'light', color: 'none' }).color,
      [`& .${getStylesRef('icon')}`]: {
        color: theme.fn.variant({ variant: 'light', color: 'none' }).color,
      },
    },
  },
}));

const data = [
  { component: 'Companions', label: 'Chatbot', icon: IconDeviceMobileMessage, dev: false },
  { component: 'Library', label: 'Library', icon: IconBook, dev: false },
  { component: 'Laboratory', label: 'Laboratory', icon: IconFlask, dev: false  },
];

type AccountType = "main" | "admin" | "moderator" | "user" | "settings" | "aiModel" | "subscription" | "announcement" | "descriptions";

export default function Sidebar() {
  const { setActiveComponent } = useActiveComponent();
  const { setShowCompanions } = useCompanion();
  const { accountType, sparkConfig } = useConfig();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const { classes, cx, theme } = useStyles();
  const { opened, toggleSidebar } = useSidebarContext();
  const mobileViewInitial = typeof window !== 'undefined' ? window.innerWidth < parseInt(theme.breakpoints.sm.replace('px', ''), 10) : false;
  const [mobileView, setMobileView] = useState(mobileViewInitial);
  const [devMode, setDevMode] = useState(false);
  const [sidebarLinks, setSidebarLinks] = useState(data);

  const shouldShowComponent = (componentName: string) => {
      if (!sparkConfig || !accountType) {
          return false;
      }
      const config = sparkConfig[accountType as keyof typeof sparkConfig];
      if (!config) {
          return false;
      }
      return config[componentName as keyof typeof config] !== false;
  };

  const shouldShowUpdateCard = () => {
      if (!sparkConfig?.announcement?.sidebarAnnouncement) {
          return false;
      }
      return sparkConfig.announcement.sidebarAnnouncement;
  };

  function hasStartWhere(config: any): config is { startWhere: string } {
      return !!config?.startWhere;
    }

    useEffect(() => {
      const config = sparkConfig && sparkConfig[accountType as AccountType];

      if (accountType && config && hasStartWhere(config)) {
          const startComponent = config.startWhere;
          switch (startComponent.toLowerCase()) {
              case 'chatbot':
                  setActiveComponent('Companions');
                  setShowCompanions(false);
                  break;
              case 'companions':
                  setActiveComponent('Companions');
                  setShowCompanions(true);
                  break;
              case 'laboratory':
                  setActiveComponent('Laboratory');
                  setShowCompanions(false);
                  break;
              case 'library':
                  setActiveComponent('Library');
                  setShowCompanions(false);
                  break;
              default:
                  break;
          }
      }
  }, [accountType, sparkConfig, setActiveComponent, setShowCompanions]);

  const adjustDataBasedOnAccountType = () => {
      const adjustedData = [...sidebarLinks];
      if (!shouldShowComponent('laboratory') && (!shouldShowComponent('getCompanions') || !shouldShowComponent('createCompanions')) ) {
        const index = adjustedData.findIndex((item) => item.component === 'Laboratory');
        if (index > -1) {
          adjustedData.splice(index, 1);
        }
        if (!adjustedData.some(item => item.component === 'MyCompanions')) {
          adjustedData.push({
            component: 'MyCompanions',
            label: 'Companions',
            icon: IconMessageChatbot,
            dev: false,
          });
        }
      }
      setSidebarLinks(adjustedData);
  };

  useEffect(() => {
    adjustDataBasedOnAccountType();
  }, []);


  useEffect(() => {
    (async () => {
      const { data: fetchedData } = await supabaseClient
        .from('user_mods')
        .select('mymods, mymodpack')
        .eq('user_id', userId)
        .single();

      if(fetchedData?.mymods) {
        const formattedMyMods = fetchedData.mymods.map((mod: Mod) => ({
          xTitle: mod.xTitle,
          xDescription: mod.xDescription,
          xIcon: mod.xIcon,
          iconColor: mod.iconColor,
          xProduct: mod.xProduct,
          xType: mod.xType,
          xShowImpressionLevels: mod.xShowImpressionLevels,
          xImpressionLevelRed: mod.xImpressionLevelRed,
          xImpressionLevelGreen: mod.xImpressionLevelGreen,
          xShowEmotionalState: mod.xShowEmotionalState,
          xPrompt: mod.xPrompt,
          xAuthor: mod.xAuthor,
          xTags: mod.xTags,
        }));

        if (Cookies.get('mymods')) {
          Cookies.remove('mymods', { domain: '.spark.study', path: '/' });
        }
        Cookies.set('mymods', JSON.stringify(fetchedData.mymods), { domain: '.spark.study', path: '/' });
      }
    })();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const breakpoint = parseInt(theme.breakpoints.sm.replace('px', ''), 10);
      setMobileView(window.innerWidth < breakpoint);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, item: { component: string }) => {
      event.preventDefault();
      if(item.component === 'MyCompanions') {
          setActiveComponent('Companions');
          setShowCompanions(true);
          if (mobileView) {
              toggleSidebar();
          }
          return;
      }
      setShowCompanions(false);
      setActiveComponent(item.component);
      if (mobileView) {
          toggleSidebar();
      }
  };

  const links = sidebarLinks
    .filter(item => (!item.dev || devMode) && shouldShowComponent(item.component.toLowerCase()))
    .map((item) => (
        <a
            className={cx(classes.link)}
            key={item.component}
            style={{cursor:'pointer'}}
            onClick={(event) => handleLinkClick(event, item)}
        >
            <item.icon className={classes.linkIcon} stroke={1.5} />
            <span>{item.label}</span>
        </a>
    ));

  return (
    <>
      <Navbar
        height="100%"
        width={{ sm: 300 }}
        p="md"
        left={mobileView ? (opened ? '0' : '-100%') : '0'}
        sx={{
          position: mobileView ? (opened ? 'fixed' : 'fixed') : 'fixed',
          transition: 'left 0.3s ease',
        }}
      >
        <Navbar.Section grow>
          {links}
        </Navbar.Section>
        <div style={{ transform: 'translateY(-15vh)' }}>
        {shouldShowUpdateCard() && <UpdateCard />}
          <Navbar.Section className={classes.footer}>
            <a href="/" onClick={() => window.open('https://spark.study/account')} className={classes.link}>
              <IconUserCircle className={classes.linkIcon} stroke={1.5} />
              <span>Account</span>
            </a>
            <a href="/" onClick={() => window.open('https://spark.study')} className={classes.link}>
              <IconLogout className={classes.linkIcon} stroke={1.5} />
              <span>Logout</span>
            </a>
          </Navbar.Section>
        </div>
      </Navbar>
    </>
  );
}

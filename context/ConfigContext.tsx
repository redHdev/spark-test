import { createContext, useContext, useEffect, useState } from 'react';
import sparkConfiguration from '../spark.config';
import { SparkConfigType } from '../types/config';

interface ConfigContextProps {
  sparkConfig: SparkConfigType | null;
  setSparkConfig: React.Dispatch<React.SetStateAction<SparkConfigType | null>>;
  accountType: string | null;
}

interface ConfigProviderProps {
  children: React.ReactNode;
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ConfigContext = createContext<ConfigContextProps | undefined>(undefined);

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [sparkConfig, setSparkConfig] = useState<SparkConfigType | null>(null);
  const [accountType, setAccountType] = useState<string>('');

  useEffect(() => {
    console.log('Spark Config state updated:', sparkConfig);
  }, [sparkConfig]);

  useEffect(() => {
    console.log('Account Type state updated:', accountType);
  }, [accountType]);

  useEffect(() => {
    if (sparkConfiguration) {
      setSparkConfig(sparkConfiguration);
    }
  }, []);

  useEffect(() => {

    const fetchAccountType = async () => {
      const { data: { user }, error} = await supabaseClient.auth.getUser();
      try {
        const { data: userAccountType, error } = await supabaseClient
          .from('account_types')
          .select('user_account_type')
          .eq('user_id', user?.id);

        if (error) {
          throw error;
        }
        if (userAccountType && userAccountType.length > 0) {
          setAccountType(userAccountType[0].user_account_type);
        }
      } catch (error) {
        console.error("Error fetching account type: ", error);
      }
    };

      fetchAccountType();

  }, [supabaseClient]);

  return (
    <ConfigContext.Provider value={{ sparkConfig, setSparkConfig, accountType }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (config === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return config;
}

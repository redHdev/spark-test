import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Progress, Paper } from '@mantine/core';
import { fetchTestState } from '../functions/useGetTestState';
import { useUser } from '@supabase/auth-helpers-react';
import { useTest } from '../../../context/TestContext';
import { createClient } from '@supabase/supabase-js';

import { usePrompt } from '../../../context/PromptConfig';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const client = createClient(supabaseUrl, supabaseAnonKey);

interface TestState {
    correct: number;
    incorrect: number;
}

const Testbar: React.FC = () => {
    const [testState, setTestState] = useState<TestState | null>(null);
    const user = useUser();
    const userId = user?.id;
    const {
        setQuestion,
        setAnswer,
        setTotalQuestions,
        setQuestionsLeft,
        setCurrentQuestionNum
    } = useTest();

    const {promptConfig, setPromptConfig} = usePrompt();

    const companionData = promptConfig?.backendCompanions || null;
    const companionId = companionData?.cCompanion;

    useEffect(() => {
      const fetchTestData = async () => {
          if (!companionId || !userId) return;
          const result = await fetchTestState(companionId, userId);
          const fetchedTestState = result.testState; // renamed for clarity
          setTestState(fetchedTestState);

          const companionDataResult = await client.from('companions').select('test_questions').eq('companion_id', companionId);
          if (companionDataResult.data && companionDataResult.data.length > 0) {
              const questions = Object.keys(companionDataResult.data[0].test_questions);
              const answers = Object.values(companionDataResult.data[0].test_questions);

              setTotalQuestions(questions.length);
              const questionsAnswered = (fetchedTestState?.correct ?? 0) + (fetchedTestState?.incorrect ?? 0);
              const currentQuestionNum = questionsAnswered + 1;

              setQuestionsLeft(questions.length - questionsAnswered);

              if (questionsAnswered <= questions.length) {
                  setAnswer(answers[questionsAnswered - 1] as string);
              }

              if (currentQuestionNum < questions.length) {
                  setAnswer(answers[currentQuestionNum] as string);
                  setQuestion(questions[currentQuestionNum]);
              }

              setCurrentQuestionNum(currentQuestionNum);
              if(promptConfig){
                  setPromptConfig({
                    ...promptConfig,
                    backendCompanions : {
                        ...promptConfig?.backendCompanions,
                        ...companionData,
                        cQuestion: currentQuestionNum <= questions.length ? questions[currentQuestionNum - 1] : "",
                        cAnswer: currentQuestionNum <= questions.length ? answers[currentQuestionNum - 1] as string : "",
                        cCorrect: fetchedTestState?.correct ?? 0,
                        cIncorrect: fetchedTestState?.incorrect ?? 0,
                    }
                  });
              }
              else{
                setPromptConfig({
                    backendCompanions : {
                        ...companionData,
                        cQuestion: currentQuestionNum <= questions.length ? questions[currentQuestionNum - 1] : "",
                        cAnswer: currentQuestionNum <= questions.length ? answers[currentQuestionNum - 1] as string : "",
                        cCorrect: fetchedTestState?.correct ?? 0,
                        cIncorrect: fetchedTestState?.incorrect ?? 0,
                    }
                  });
              }
          }
      };
        fetchTestData();
        const intervalId = setInterval(fetchTestData, 5000);
        return () => clearInterval(intervalId);
    }, [companionId, userId]);

    let percentage = 0;
    if (testState) {
        const total = testState.correct + testState.incorrect;
        percentage = total !== 0 ? Math.round((testState.correct / total) * 100) : 0;
    }

    return (
        <>
            <Box style={{ paddingBottom: '10px', marginBottom: '20px' }}>
                <Flex direction="column" align="center" style={{ width: '100%' }}>
                    <Flex direction="row" justify="center" style={{ marginBottom: '10px' }}>
                    <Paper shadow="sm" style={{transform:'translateY(8px)', borderRadius:'100%', borderBottomLeftRadius:'0px', borderBottomRightRadius:'0px', width:'65px', height:'32.5px', border:'1px solid rgba(160,160,160,0.18)'}}>
                      <Flex align="center" justify="center" direction="column" style={{transform:'translateY(1px)'}}>
                        <Text style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                            {percentage}%
                        </Text>
                      </Flex>
                    </Paper>
                        <Flex direction="column" align="end" style={{ position: 'absolute', right: '5px', transform:'translateY(-10px)' }}>
                            <Text style={{ fontWeight: 'bold' }}>
                                {testState?.correct ?? 0}✅
                            </Text>
                            <Text style={{ fontWeight: 'bold' }}>
                                {testState?.incorrect ?? 0}❌
                            </Text>
                        </Flex>
                    </Flex>
                    <Progress
                      size="sm"
                      style={{ width: '95%' }}
                      sections={[
                          { value: percentage, color: 'green' },
                          { value: 100 - percentage, color: 'red' },
                      ]}
                    />
                </Flex>
            </Box>
        </>
    );
};

export default Testbar;

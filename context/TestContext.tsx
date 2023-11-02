import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TestContextType {
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  question: string;
  setTotalQuestions: React.Dispatch<React.SetStateAction<number>>;
  totalQuestions: number;
  setQuestionsLeft: React.Dispatch<React.SetStateAction<number>>;
  questionsLeft: number;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  answer: string;
  setIncorrect: React.Dispatch<React.SetStateAction<number>>;
  incorrect: number;
  setCorrect: React.Dispatch<React.SetStateAction<number>>;
  correct: number;
  setCurrentQuestionNum: React.Dispatch<React.SetStateAction<number>>;
  currentQuestionNum: number;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};

interface TestProviderProps {
  children: ReactNode;
}

export const TestProvider: React.FC<TestProviderProps> = ({ children }) => {
  const [question, setQuestion] = useState<string>('');
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionsLeft, setQuestionsLeft] = useState<number>(0);
  const [answer, setAnswer] = useState<string>('');
  const [incorrect, setIncorrect] = useState<number>(0);
  const [correct, setCorrect] = useState<number>(0);


    useEffect(() => {
      console.log("Question has changed:", question);
    }, [question]);

    useEffect(() => {
      console.log("Current Question Number has changed:", currentQuestionNum);
    }, [currentQuestionNum]);

    useEffect(() => {
      console.log("Total Questions has changed:", totalQuestions);
    }, [totalQuestions]);

    useEffect(() => {
      console.log("Questions Left has changed:", questionsLeft);
    }, [questionsLeft]);

    useEffect(() => {
      console.log("Answer has changed:", answer);
    }, [answer]);

    useEffect(() => {
      console.log("Incorrect count has changed:", incorrect);
    }, [incorrect]);

    useEffect(() => {
      console.log("Correct count has changed:", correct);
    }, [correct]);
    
  const value = {
    setQuestion,
    question,
    setTotalQuestions,
    totalQuestions,
    setQuestionsLeft,
    questionsLeft,
    setAnswer,
    answer,
    setIncorrect,
    incorrect,
    setCorrect,
    correct,
    setCurrentQuestionNum,
    currentQuestionNum
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

export default TestContext;

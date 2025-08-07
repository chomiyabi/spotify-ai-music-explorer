import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  image?: string;
  preview_url?: string;
  external_url?: string;
  popularity?: number;
  position?: number;
}

export interface SearchResult {
  success: boolean;
  query?: string;
  type?: string;
  total?: number;
  tracks?: Track[];
  playlist_name?: string;
  playlist_description?: string;
  interpretation?: any; // AI検索時のクエリ解釈結果
  ai_suggestions?: string[]; // AI提案
}

interface AppState {
  isLoading: boolean;
  currentData: SearchResult | null;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: SearchResult }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_DATA' };

const initialState: AppState = {
  isLoading: false,
  currentData: null,
  error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    case 'SET_DATA':
      return {
        ...state,
        currentData: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'CLEAR_DATA':
      return {
        ...state,
        currentData: null,
        error: null,
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
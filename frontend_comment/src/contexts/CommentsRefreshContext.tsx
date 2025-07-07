import React, { createContext, useContext, useState, useCallback } from "react";

interface CommentsRefreshContextType {
  refreshKey: number;
  refreshComments: () => void;
}

const CommentsRefreshContext = createContext<
  CommentsRefreshContextType | undefined
>(undefined);

export const useCommentsRefresh = () => {
  const context = useContext(CommentsRefreshContext);
  if (!context) {
    throw new Error(
      "useCommentsRefresh must be used within a CommentsRefreshProvider"
    );
  }
  return context;
};

interface CommentsRefreshProviderProps {
  children: React.ReactNode;
}

export const CommentsRefreshProvider: React.FC<
  CommentsRefreshProviderProps
> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshComments = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = React.useMemo(
    () => ({
      refreshKey,
      refreshComments,
    }),
    [refreshKey, refreshComments]
  );

  return (
    <CommentsRefreshContext.Provider value={value}>
      {children}
    </CommentsRefreshContext.Provider>
  );
};

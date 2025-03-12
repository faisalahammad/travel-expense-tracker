import React, { createContext, useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, PlanningTask, Tour } from "../types";

const initialState: AppState = {
  tours: [],
  activeTourId: null,
  planningTasks: [],
};

export interface AppContextType {
  tours: Tour[];
  activeTourId: string | null;
  planningTasks: PlanningTask[];
  addPlanningTask: (task: Omit<PlanningTask, "id">) => void;
  updatePlanningTask: (taskId: string, updates: Partial<PlanningTask>) => void;
  deletePlanningTask: (taskId: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const addPlanningTask = useCallback((task: Omit<PlanningTask, "id">) => {
    setState((prevState: AppState) => {
      const newTask: PlanningTask = {
        ...task,
        id: uuidv4(),
      };
      return {
        ...prevState,
        planningTasks: [...prevState.planningTasks, newTask],
      };
    });
  }, []);

  const updatePlanningTask = useCallback((taskId: string, updates: Partial<PlanningTask>) => {
    setState((prevState: AppState) => ({
      ...prevState,
      planningTasks: prevState.planningTasks.map((task: PlanningTask) => (task.id === taskId ? { ...task, ...updates } : task)),
    }));
  }, []);

  const deletePlanningTask = useCallback((taskId: string) => {
    setState((prevState: AppState) => ({
      ...prevState,
      planningTasks: prevState.planningTasks.filter((task) => task.id !== taskId),
    }));
  }, []);

  const value = useMemo(
    () => ({
      tours: state.tours,
      activeTourId: state.activeTourId,
      planningTasks: state.planningTasks,
      addPlanningTask,
      updatePlanningTask,
      deletePlanningTask,
    }),
    [state, addPlanningTask, updatePlanningTask, deletePlanningTask]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

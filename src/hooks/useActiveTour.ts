import { useAppContext } from "../context/AppContext";

export const useActiveTour = () => {
  const { state } = useAppContext();
  const { tours, activeTourId } = state;

  const activeTour = tours.find((tour) => tour.id === activeTourId);

  return {
    activeTour,
    activeTourId,
    isLoading: false,
    error: null,
  };
};

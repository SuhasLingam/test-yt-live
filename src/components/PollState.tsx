import { useEffect } from "react";
import { usePollContext } from "@/contexts/PollContext";
import { api } from "@/utils/api";

const PollState = () => {
  const {
    sessionId,
    liveChatId,
    chartData,
    firstResponders,
    selectedOption,
    fetching,
  } = usePollContext();

  const updateStateMutation = api.poll.updateState.useMutation();

  useEffect(() => {
    if (!sessionId || !liveChatId) return;

    void updateStateMutation.mutateAsync({
      sessionId,
      liveChatId,
      chartData,
      firstResponders,
      selectedOption,
      isFetching: fetching,
    });
  }, [
    sessionId,
    liveChatId,
    chartData,
    firstResponders,
    selectedOption,
    fetching,
    updateStateMutation,
  ]);

  return null;
};

export default PollState;

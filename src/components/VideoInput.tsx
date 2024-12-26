import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePollContext } from "@/contexts/PollContext";
import { api } from "@/utils/api";

const VideoInput = () => {
  const router = useRouter();
  const { setLiveChatId } = usePollContext();
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);

  const liveChatMutation = api.youtube.getLiveChatId.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) return;

    try {
      setLoading(true);
      const result = await liveChatMutation.mutateAsync({ videoId });
      setLiveChatId(result.liveChatId, result.videoId);
      router.push("/poll-time");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get live chat ID. Please check if the video is live.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full max-w-md">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Enter YouTube Video ID"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !videoId}
          className={`rounded-lg px-4 py-2 transition ${
            loading || !videoId
              ? "cursor-not-allowed bg-gray-400"
              : "bg-black text-white hover:bg-black/80"
          }`}
        >
          {loading ? "Loading..." : "Start Poll"}
        </button>
      </div>
    </form>
  );
};

export default VideoInput;

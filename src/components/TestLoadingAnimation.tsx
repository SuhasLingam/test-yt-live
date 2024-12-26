"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Mosaic } from "react-loading-indicators";

interface TestLoadingAnimationProps {
  initialTime: number;
}

const TestLoadingAnimation = ({ initialTime }: TestLoadingAnimationProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Pulsating animation for the message
    if (messageRef.current) {
      gsap.fromTo(
        messageRef.current,
        { opacity: 0.5, scale: 1 },
        {
          opacity: 1,
          scale: 1.2,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        },
      );
    }

    return () => {
      clearInterval(timer);
    };
  }, [initialTime]);

  return (
    <div className="mt-12 flex min-h-[60vh] flex-col items-center justify-center bg-gray-100">
      <div className="relative h-[100px] w-[100px]">
        <Mosaic
          color={["#33CCCC", "#33CC36", "#B8CC33", "#FCCA00"]}
          size="large"
        />
      </div>

      <div
        ref={messageRef}
        className="mt-8 text-2xl font-semibold text-gray-700"
      >
        Poll is Running
      </div>

      <div className="mt-4 text-base text-gray-500">
        Results will be available in {timeLeft} seconds
      </div>
    </div>
  );
};

export default TestLoadingAnimation;

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { HiSparkles, HiPlay, HiArrowRight } from "react-icons/hi2";

export default function ScoreboardMagic() {
  const [livestreamLink, setLivestreamLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const exampleUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  useEffect(() => {
    const typeUrl = () => {
      let currentIndex = 0;
      setIsTyping(true);
      setIsLive(false);
      setIsPressed(false);
      setLivestreamLink("");
      
      const typingInterval = setInterval(() => {
        if (currentIndex < exampleUrl.length) {
          setLivestreamLink(exampleUrl.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
          // Simulate button press animation
          setTimeout(() => {
            setIsPressed(true);
            // Turn red after press animation
            setTimeout(() => {
              setIsLive(true);
              setIsPressed(false);
              // After showing Live, reset and loop
              setTimeout(() => {
                setIsLive(false);
                typeUrl(); // Loop back
              }, 3000); // Show Live for 3 seconds before looping
            }, 200); // Press animation duration
          }, 500);
        }
      }, 50); // Typing speed

      return typingInterval;
    };

    const interval = typeUrl();

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!livestreamLink.trim()) return;
    
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      // In a real implementation, this would process the link and show the scoreboard
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="flex items-center gap-3 p-1 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-black/10 shadow-lg focus-within:border-black/20 focus-within:shadow-xl transition-all">
            <div className="flex-shrink-0 pl-4">
              <HiPlay className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="url"
              value={livestreamLink}
              readOnly
              placeholder="Paste your livestream URL here (YouTube, Twitch, etc.)"
              className="flex-1 py-4 px-2 bg-transparent border-none outline-none text-base text-black placeholder:text-zinc-400 cursor-default"
            />
            <div 
              className={`flex-shrink-0 mr-2 px-4 py-2 font-bold text-sm rounded-xl flex items-center gap-2 transition-all duration-200 ${
                isLive 
                  ? "bg-red-600 text-white" 
                  : "bg-zinc-400 text-white"
              } ${isPressed ? "scale-95" : "scale-100"}`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isLive 
                  ? "bg-white animate-pulse" 
                  : "bg-white/70"
              }`} />
              <span>Live</span>
            </div>
          </div>
        </div>

      </form>

      {/* Video Placeholder */}
      <div className="mt-8 w-full">
        <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden border-2 border-black/10 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <HiPlay className="w-10 h-10 text-white ml-1" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-lg">Livestream Preview</p>
                <p className="text-zinc-400 text-sm">
                  {livestreamLink ? "Processing your stream..." : "Enter a livestream URL above to see the magic"}
                </p>
              </div>
            </div>
          </div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Scoreboard Preview */}
      <div className="mt-8 w-full">
        <div className="relative w-full" style={{ aspectRatio: '1920/540' }}>
          <Image
            src="/scoreboard1.svg"
            alt="Live scoreboard overlay preview"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}



export const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 px-4 py-2 bg-white rounded-2xl shadow-sm max-w-[80px] mb-4">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-1"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-2"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-3"></div>
    </div>
  );
};


export const LoadingSpinner = () => {
  return (
    <div className="grid place-items-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sensa-purple"></div>
        <p className="text-sensa-purple">Cargando...</p>
      </div>
    </div>
  );
};

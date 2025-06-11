import logoImage from "@assets/ChatGPT Image Jun 11, 2025, 10_14_38 PM_1749669295744.png";

export function AppHeader() {
  return (
    <header className="w-full bg-[rgb(28,28,28)] border-b border-gray-800 px-6 py-4">
      <div className="flex items-center">
        <img 
          src={logoImage} 
          alt="TrainUp Logo" 
          className="h-10 w-10 mr-3"
        />
        <h1 className="text-xl font-bold text-primary">TrainUp</h1>
      </div>
    </header>
  );
}
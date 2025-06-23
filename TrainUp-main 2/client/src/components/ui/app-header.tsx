import { LogoWithText } from "./logo";

export function AppHeader() {
  return (
    <header className="w-full bg-[rgb(28,28,28)] border-b border-gray-800 px-6 py-4">
      <div className="flex items-center">
        <LogoWithText logoSize="sm" variant="dark" className="text-xl" />
      </div>
    </header>
  );
}
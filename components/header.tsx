import { ModeSwitcher } from "./mode-switcher";

export function Header() {
  return (
    <header className="absolute top-0 right-0 flex justify-end items-center p-4">
      <ModeSwitcher />
    </header>
  );
}
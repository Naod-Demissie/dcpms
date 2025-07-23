import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./theme-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { NotificationSystem } from "./notification-system";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-[var(--header-height-mobile)] sm:h-[var(--header-height)] shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-2 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <NotificationSystem />
          </div>
          <ModeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}

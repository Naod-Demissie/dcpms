"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NavUser } from "./nav-user";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Home,
  Users,
  Clipboard,
  FileText,
  UserCheck,
  Settings,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  visible?: string[];
}

interface NavLink extends NavItem {
  items?: never;
}

interface NavCollapsible extends NavItem {
  items: NavLink[];
}

type NavGroup = {
  title: string;
  items: (NavLink | NavCollapsible)[];
};

type SidebarData = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navGroups: NavGroup[];
};

const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Home",
          url: "/home",
          // icon: IconLayoutDashboard,
          icon: Home,
          visible: ["admin", "dentist", "receptionist"],
        },
        {
          title: "Patients",
          url: "/patients",
          icon: Users,
          visible: ["admin", "receptionist"],
        },
        {
          title: "Staff",
          url: "/staff",
          icon: UserCheck,
          visible: ["admin"],
        },
        {
          title: "Prescriptions",
          url: "/prescriptions",
          icon: Clipboard,
          visible: ["admin", "dentist"],
        },
        {
          title: "Invoices",
          url: "/invoices",
          icon: FileText,
          visible: ["admin", "receptionist"],
        },
      ],
    },

    {
      title: "Other",
      items: [
        {
          title: "Treatment Templates",
          url: "/treatment-templates",
          icon: Clipboard,
          visible: ["admin", "dentist", "receptionist"],
        },

        {
          title: "Account",
          icon: Settings,
          url: "/account",
          visible: ["admin", "dentist", "receptionist"],
        },
      ],
    },
  ],
};

export function NavGroup({ title, items }: NavGroup) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item: NavItem) => {
          const key = `${item.title}-${item.url}`;

          if (!("items" in item))
            return (
              <SidebarMenuLink key={key} item={item as NavLink} href={href} />
            );

          if (state === "collapsed" && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item as NavCollapsible}
                href={href}
              />
            );

          return (
            <SidebarMenuCollapsible
              key={key}
              item={item as NavCollapsible}
              href={href}
            />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
);

const SidebarMenuLink = ({ item, href }: { item: NavLink; href: string }) => {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link href={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  const { setOpenMobile } = useSidebar();
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {item.items.map((subItem: NavLink) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(href, subItem)}
                >
                  <Link href={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ""}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub: NavLink) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                href={sub.url}
                className={`${checkIsActive(href, sub) ? "bg-secondary" : ""}`}
              >
                {sub.icon && <sub.icon />}
                <span className="max-w-52 text-wrap">{sub.title}</span>
                {sub.badge && (
                  <span className="ml-auto text-xs">{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  if ("items" in item) {
    return (
      href === item.url || // /endpoint?search=param
      href.split("?")[0] === item.url || // /endpoint
      (Array.isArray(item.items) &&
        item.items.filter((i: NavLink) => i.url === href).length > 0) || // if child nav is active
      (mainNav &&
        href.split("/")[1] !== "" &&
        href.split("/")[1] === item?.url?.split("/")[1])
    );
  }
  return (
    href === item.url || // /endpoint?search=param
    href.split("?")[0] === item.url // /endpoint
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navGroups = sidebarData?.navGroups || [];

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} title={group.title} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

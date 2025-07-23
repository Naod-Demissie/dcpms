// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarRail,
// } from "@/components/ui/sidebar";
// import { NavGroup } from "./nav-group";
// // import { NavUser } from "./nav-user";
// // import { TeamSwitcher } from "@/components/layout/team-switcher";
// import { sidebarData } from "./sidebar-data";

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   console.log("Imported sidebarData:", sidebarData);
//   const navGroups = sidebarData?.navGroups || [];

//   return (
//     <Sidebar collapsible="icon" variant="floating" {...props}>
//       <SidebarHeader>
//         {/* <TeamSwitcher teams={sidebarData?.teams} /> */}
//       </SidebarHeader>
//       <SidebarContent>
//         {navGroups.map((group) => (
//           <NavGroup key={group.title} title={group.title} items={group.items} />
//         ))}
//       </SidebarContent>
//       <SidebarFooter>
//         <p>Hello</p>
//         {/* <NavUser user={sidebarData.user} /> */}
//       </SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   );
// }

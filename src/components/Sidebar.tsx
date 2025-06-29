"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { signOut, useSession } from 'next-auth/react';
import {
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon // Example for a settings link
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils'; // For conditional classes

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/classrooms', label: 'Classrooms', icon: UserGroupIcon },
  { href: '/messages', label: 'Messages', icon: ChatBubbleLeftEllipsisIcon },
  // Example: Add more items here if needed
  // { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname(); // Get current pathname

  // Use theme variables for colors for better consistency
  // These would ideally come from a theme configuration or CSS variables directly if not using Tailwind's HSL system.
  // For now, assuming bg-gray-800 is our sidebar background (can be changed to bg-card or similar if desired)
  // and text-white is the primary text color.
  // Active state: bg-primary text-primary-foreground (or a variation)

  return (
    <div className="bg-secondary text-secondary-foreground w-64 h-screen flex flex-col fixed top-0 left-0 shadow-lg"> {/* Changed to use theme colors */}
      <div className="p-5 text-2xl font-bold border-b border-border"> {/* Use theme border */}
        EduConnect
      </div>
      <nav className="flex-1 mt-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/dashboard");
          // Special case for dashboard to not be active if a sub-path of another item is active
          const isDashboardSpecialCase = item.href === "/dashboard" && navItems.some(otherItem => otherItem.href !== "/dashboard" && pathname.startsWith(otherItem.href));


          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center py-2.5 px-3 rounded-md text-sm font-medium transition-colors duration-150 group",
                (isActive && !isDashboardSpecialCase)
                  ? "bg-primary text-primary-foreground shadow-sm" // Active state
                  : "hover:bg-accent hover:text-accent-foreground", // Hover state
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-secondary" // Focus state
              )}
            >
              <item.icon className={cn("h-5 w-5 mr-3", isActive && !isDashboardSpecialCase ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {session && (
        <div className="p-3 border-t border-border mt-auto"> {/* Use theme border */}
          <div className="mb-2 px-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })} // Redirect to login after sign out
            className="flex items-center w-full py-2.5 px-3 text-sm font-medium rounded-md text-destructive-foreground bg-destructive/80 hover:bg-destructive transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-secondary"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Settings, Zap, BarChart3 } from "lucide-react";

export function TopBar() {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
      {/* Quick Navigation (left) */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">Week</Button>
        <Button variant="ghost" size="sm">Month</Button>
      </div>

      {/* Today + Date (center) */}
      <div className="text-center">
        <h1 className="text-xl font-medium text-gray-900">Today</h1>
        <p className="text-sm text-gray-600">{dateString}</p>
      </div>

      {/* Profile Menu (right) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/api/placeholder/32/32" alt="Profile" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Zap className="mr-2 h-4 w-4" />
            Integrations
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <BarChart3 className="mr-2 h-4 w-4" />
            Batch Mode
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BarChart3 className="mr-2 h-4 w-4" />
            Spread Mode
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BarChart3 className="mr-2 h-4 w-4" />
            Hybrid Mode
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
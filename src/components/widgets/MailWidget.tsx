import React from "react";
import { Mail, Star, Archive, Trash2 } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const mockEmails = [
  {
    id: 1,
    sender: "Sarah Chen",
    subject: "Q4 Budget Review Meeting",
    avatar: "SC",
    time: "2m ago",
    priority: "high"
  },
  {
    id: 2,
    sender: "Marketing Team",
    subject: "Campaign Performance Report",
    avatar: "MT",
    time: "1h ago",
    priority: "normal"
  },
  {
    id: 3,
    sender: "John Miller",
    subject: "Project Timeline Update",
    avatar: "JM",
    time: "3h ago",
    priority: "low"
  }
];

interface MailWidgetProps {
  onExpand?: () => void;
  icon?: React.ReactNode;
}

export function MailWidget({ onExpand, icon }: MailWidgetProps) {
  const frontContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Recent emails summary:</p>
      <ul className="space-y-3">
        {mockEmails.map((email) => (
          <li key={email.id} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{email.subject}</p>
              <p className="text-xs text-gray-500">{email.sender} • {email.time}</p>
              {email.priority === "high" && (
                <Badge variant="destructive" className="text-xs mt-1">Priority</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4 italic">Click to see detailed actions</p>
    </div>
  );

  const backContent = (
    <div className="space-y-6">
      {/* Priority Emails */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-orange-500 fill-current" />
          <h4 className="font-medium text-gray-900">Priority Emails</h4>
        </div>
        <div className="space-y-3">
          {mockEmails.filter(e => e.priority === "high").map((email) => (
            <div key={email.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{email.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                    <span className="text-xs text-gray-500">{email.time}</span>
                  </div>
                  <p className="font-medium text-sm">{email.subject}</p>
                  <p className="text-xs text-gray-600">{email.sender}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regular Emails */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recent Messages</h4>
        <div className="space-y-2">
          {mockEmails.filter(e => e.priority !== "high").map((email) => (
            <div key={email.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{email.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{email.subject}</p>
                <p className="text-xs text-gray-500">{email.sender} • {email.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="justify-start">
            <Archive className="h-4 w-4 mr-2" />
            Archive All
          </Button>
          <Button size="sm" variant="outline" className="justify-start">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Read
          </Button>
          <Button size="sm" className="justify-start col-span-2">
            <Mail className="h-4 w-4 mr-2" />
            Compose New Email
          </Button>
        </div>
      </div>

      {/* Email Stats */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Email Summary</h5>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{mockEmails.length}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">{mockEmails.filter(e => e.priority === "high").length}</div>
            <div className="text-gray-600">Priority</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">2</div>
            <div className="text-gray-600">Replied</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={icon || <Mail className="h-5 w-5" />}
      title="Mail"
      count={3}
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}
import { Mail, Star, Archive, Trash2, Reply, Forward, Search, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

const allEmails = [
  {
    id: 1,
    sender: "Sarah Chen",
    email: "sarah.chen@company.com",
    subject: "Q4 Budget Review Meeting",
    preview: "Hi team, I've scheduled our quarterly budget review for next week. Please prepare your department's spending reports...",
    time: "2m ago",
    priority: "high",
    unread: true,
    avatar: "SC"
  },
  {
    id: 2,
    sender: "Marketing Team",
    email: "marketing@company.com", 
    subject: "Campaign Performance Report",
    preview: "Our latest email campaign achieved a 4.2% click-through rate, which is above industry average. Here's the breakdown...",
    time: "1h ago",
    priority: "normal",
    unread: true,
    avatar: "MT"
  },
  {
    id: 3,
    sender: "John Miller",
    email: "john.miller@company.com",
    subject: "Project Timeline Update",
    preview: "The development phase is progressing well. We're on track to deliver the MVP by the end of this month...",
    time: "3h ago",
    priority: "low",
    unread: true,
    avatar: "JM"
  },
  {
    id: 4,
    sender: "HR Department",
    email: "hr@company.com",
    subject: "Benefits Enrollment Deadline",
    preview: "Reminder: The deadline for benefits enrollment is approaching. Please complete your selections by Friday...",
    time: "5h ago",
    priority: "medium",
    unread: false,
    avatar: "HR"
  },
  {
    id: 5,
    sender: "Alex Rodriguez", 
    email: "alex.r@company.com",
    subject: "Design Review Feedback",
    preview: "I've reviewed the latest mockups and have some suggestions for improvement. Overall, the direction looks great...",
    time: "1d ago",
    priority: "normal",
    unread: false,
    avatar: "AR"
  },
  {
    id: 6,
    sender: "Finance Team",
    email: "finance@company.com",
    subject: "Expense Report Approval",
    preview: "Your expense report for October has been approved. The reimbursement will be processed in the next payroll cycle...",
    time: "2d ago",
    priority: "low",
    unread: false,
    avatar: "FT"
  }
];

export function ExpandedMailWidget() {
  const priorityEmails = allEmails.filter(e => e.priority === "high");
  const unreadEmails = allEmails.filter(e => e.unread && e.priority !== "high");
  const readEmails = allEmails.filter(e => !e.unread);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column - Email List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search and Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search emails..." className="pl-10" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Priority Section */}
        {priorityEmails.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-orange-500 fill-current" />
              <h3 className="font-medium">Priority ({priorityEmails.length})</h3>
            </div>
            <div className="space-y-2">
              {priorityEmails.map((email) => (
                <div key={email.id} className="p-4 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarFallback className="text-sm">{email.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{email.sender}</p>
                        <span className="text-xs text-gray-500">{email.time}</span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{email.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{email.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Unread Section */}
        {unreadEmails.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Unread ({unreadEmails.length})</h3>
            <div className="space-y-2">
              {unreadEmails.map((email) => (
                <div key={email.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarFallback className="text-sm">{email.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{email.sender}</p>
                        <span className="text-xs text-gray-500">{email.time}</span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{email.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{email.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Read Section */}
        <div>
          <h3 className="font-medium mb-3 text-gray-600">Read ({readEmails.length})</h3>
          <div className="space-y-2">
            {readEmails.map((email) => (
              <div key={email.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors opacity-60">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarFallback className="text-sm">{email.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{email.sender}</p>
                      <span className="text-xs text-gray-500">{email.time}</span>
                    </div>
                    <h4 className="text-sm mb-1">{email.subject}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">{email.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Quick Actions */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start">
              <Reply className="h-4 w-4 mr-2" />
              Reply to Selected
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Archive className="h-4 w-4 mr-2" />
              Archive All Read
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Email Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total emails:</span>
              <span className="font-medium">{allEmails.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unread:</span>
              <span className="font-medium">{allEmails.filter(e => e.unread).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Priority:</span>
              <span className="font-medium text-red-600">{priorityEmails.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Recent Activity</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>3 emails received in last hour</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>5 emails replied today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>12 emails archived this week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
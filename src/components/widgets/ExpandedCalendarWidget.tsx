import { Calendar, Clock, Shield, Mail, RotateCcw, Video, MapPin, Users, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8; // Start from 8 AM
  const time12 = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
  return {
    time: time12,
    hour24: `${hour.toString().padStart(2, '0')}:00`,
    events: []
  };
});

const todayEvents = [
  {
    id: 1,
    title: "Team Standup",
    time: "10:00 AM - 10:30 AM",
    startHour: 10,
    duration: 0.5,
    type: "meeting",
    attendees: ["SC", "JM", "AR", "MT"],
    location: "Conference Room A",
    description: "Daily team synchronization meeting to discuss progress and blockers",
    priority: "medium",
    color: "bg-blue-100 border-blue-300 text-blue-800"
  },
  {
    id: 2,
    title: "Client Presentation",
    time: "2:00 PM - 3:00 PM", 
    startHour: 14,
    duration: 1,
    type: "important",
    attendees: ["SC", "AR"],
    location: "Zoom",
    description: "Quarterly review presentation for our key client",
    priority: "high",
    color: "bg-red-100 border-red-300 text-red-800"
  },
  {
    id: 3,
    title: "Code Review Session",
    time: "4:00 PM - 5:00 PM",
    startHour: 16,
    duration: 1,
    type: "work",
    attendees: ["JM", "Dev Team"],
    location: "Development Lab",
    description: "Review pull requests for the authentication module",
    priority: "medium",
    color: "bg-green-100 border-green-300 text-green-800"
  },
  {
    id: 4,
    title: "Focus Time - Deep Work",
    time: "9:00 AM - 11:00 AM",
    startHour: 9,
    duration: 2,
    type: "focus",
    attendees: ["You"],
    location: "Your Office",
    description: "Dedicated time for deep work on the quarterly report",
    priority: "high",
    color: "bg-purple-100 border-purple-300 text-purple-800"
  },
  {
    id: 5,
    title: "Lunch with Marketing Team",
    time: "12:00 PM - 1:00 PM",
    startHour: 12,
    duration: 1,
    type: "social",
    attendees: ["MT", "Sarah", "Alex"],
    location: "Downtown Bistro", 
    description: "Team lunch to discuss upcoming campaign strategies",
    priority: "low",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800"
  }
];

// Map events to time slots
timeSlots.forEach(slot => {
  const slotHour = parseInt(slot.hour24.split(':')[0]);
  todayEvents.forEach(event => {
    if (event.startHour === slotHour) {
      slot.events.push(event);
    }
  });
});

const upcomingMeetings = todayEvents
  .filter(event => event.startHour >= new Date().getHours())
  .sort((a, b) => a.startHour - b.startHour)
  .slice(0, 3);

export function ExpandedCalendarWidget() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Main Calendar View - Takes up 3 columns */}
      <div className="lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Today - Saturday, September 20, 2025</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Defend Focus
            </Button>
          </div>
        </div>

        {/* Time Grid */}
        <div className="border rounded-lg overflow-hidden">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex border-b border-gray-200 last:border-b-0 min-h-[80px]">
              {/* Time Column */}
              <div className="w-20 p-3 border-r border-gray-200 text-sm text-gray-600 bg-gray-50">
                {slot.time}
              </div>
              
              {/* Event Column */}
              <div className="flex-1 p-2 relative">
                {slot.events.length > 0 ? (
                  <div className="space-y-1">
                    {slot.events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${event.color}`}
                        style={{ height: `${Math.max(event.duration * 60, 60)}px` }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {event.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-75 mb-2">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <p className="text-xs opacity-75 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 opacity-75" />
                          <div className="flex -space-x-1">
                            {event.attendees.slice(0, 3).map((attendee, i) => (
                              <Avatar key={i} className="h-5 w-5 border border-white">
                                <AvatarFallback className="text-xs">{attendee}</AvatarFallback>
                              </Avatar>
                            ))}
                            {event.attendees.length > 3 && (
                              <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                +{event.attendees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Meeting Details & Actions */}
      <div className="space-y-4">
        {/* Next Meeting */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Next Meeting</h3>
          {upcomingMeetings[0] ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{upcomingMeetings[0].title}</h4>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                {upcomingMeetings[0].time}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                {upcomingMeetings[0].location}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1">
                  <Video className="h-3 w-3 mr-1" />
                  Join
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No upcoming meetings</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Defend Focus Time
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reschedule Meeting
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Update
            </Button>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Today's Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total meetings:</span>
              <span className="font-medium">{todayEvents.filter(e => e.type === 'meeting' || e.type === 'important').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Focus time:</span>
              <span className="font-medium">2 hours</span>
            </div>
            <div className="flex justify-between">
              <span>Available slots:</span>
              <span className="font-medium">{timeSlots.filter(s => s.events.length === 0).length}</span>
            </div>
          </div>
        </div>

        {/* Upcoming This Week */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">This Week</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>8 meetings scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>12 hours focus time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>3 client presentations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
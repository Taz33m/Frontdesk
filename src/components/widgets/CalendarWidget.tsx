import React from "react";
import { Calendar, Clock, Shield, Mail, RotateCcw } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const timeSlots = [
  { time: "9:00 AM", event: null, available: true },
  { time: "10:00 AM", event: "Team Standup", color: "bg-blue-100 text-blue-800", active: true },
  { time: "11:00 AM", event: null, available: true },
  { time: "12:00 PM", event: "Lunch Break", color: "bg-green-100 text-green-800", active: false },
  { time: "1:00 PM", event: null, available: true },
  { time: "2:00 PM", event: "Client Call", color: "bg-purple-100 text-purple-800", active: false },
  { time: "3:00 PM", event: null, available: true },
  { time: "4:00 PM", event: null, available: true }
];

const todayEvents = [
  {
    id: 1,
    title: "Team Standup",
    time: "10:00 AM - 10:30 AM",
    type: "meeting",
    attendees: 5
  },
  {
    id: 2,
    title: "Client Presentation",
    time: "2:00 PM - 3:00 PM", 
    type: "important",
    attendees: 3
  },
  {
    id: 3,
    title: "Code Review Session",
    time: "4:00 PM - 5:00 PM",
    type: "work",
    attendees: 2
  }
];

interface CalendarWidgetProps {
  onExpand?: () => void;
  icon?: React.ReactNode;
}

export function CalendarWidget({ onExpand, icon }: CalendarWidgetProps) {
  const frontContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Today's schedule:</p>
      <ul className="space-y-3">
        {todayEvents.map((event) => (
          <li key={event.id} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{event.time}</span>
                <Badge 
                  variant={event.type === "important" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {event.attendees} people
                </Badge>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Next: Team Standup</p>
            <p className="text-xs text-gray-500">in 15 minutes</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">Active</Badge>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 italic">Click to manage schedule</p>
    </div>
  );

  const backContent = (
    <div className="space-y-6">
      {/* Today's Timeline */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Today's Timeline</h4>
        <div className="space-y-3">
          {todayEvents.map((event) => (
            <div key={event.id} className={`p-3 rounded-lg border-l-4 ${
              event.type === "important" ? "bg-red-50 border-red-300" : 
              event.type === "meeting" ? "bg-blue-50 border-blue-300" : 
              "bg-green-50 border-green-300"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">{event.title}</h5>
                <Badge 
                  variant={event.type === "important" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {event.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Clock className="h-3 w-3" />
                <span>{event.time}</span>
                <span>•</span>
                <span>{event.attendees} attendees</span>
              </div>
              {event.type === "important" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Join Meeting
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Share Screen
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid Overview */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Time Blocks</h4>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((slot, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{slot.time.split(' ')[0]}</div>
              <div 
                className={`h-10 rounded text-xs flex items-center justify-center ${
                  slot.event 
                    ? `${slot.color} ${slot.active ? 'ring-2 ring-blue-500' : ''}`
                    : 'bg-gray-50 border border-dashed border-gray-200 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                {slot.event ? (
                  <span className="truncate px-1">{slot.event.split(' ')[0]}</span>
                ) : (
                  <span className="text-gray-400">Free</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button size="sm" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Defend Focus Time (2 hours available)
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="justify-start">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <Button size="sm" variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Note
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Today's Summary</h5>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{todayEvents.length}</div>
            <div className="text-gray-600">Meetings</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">4</div>
            <div className="text-gray-600">Free Hours</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-orange-600">1</div>
            <div className="text-gray-600">Priority</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={icon || <Calendar className="h-5 w-5" />}
      title="Today"
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}
import { CheckSquare, Calendar, Clock, Plus } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const mockTasks = [
  {
    id: 1,
    title: "Complete Q4 Performance Review",
    dueDate: "Today, 3:00 PM",
    priority: "high",
    type: "work"
  },
  {
    id: 2,
    title: "Submit Project Proposal",
    dueDate: "Tomorrow, 9:00 AM",
    priority: "medium",
    type: "work"
  },
  {
    id: 3,
    title: "Team Standup Meeting Prep",
    dueDate: "Monday, 10:00 AM",
    priority: "low",
    type: "work"
  }
];

const stockPrices = [
  { symbol: "AAPL", price: "$173.50", change: "+1.2%" },
  { symbol: "GOOGL", price: "$2,840.25", change: "-0.8%" },
  { symbol: "MSFT", price: "$378.85", change: "+0.5%" }
];

interface TasksWidgetProps {
  onExpand?: () => void;
}

export function TasksWidget({ onExpand }: TasksWidgetProps) {
  const frontContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Today's focus areas:</p>
      <ul className="space-y-3">
        {mockTasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{task.dueDate}</span>
                <Badge 
                  variant={task.priority === "high" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Market Watch:</p>
        <div className="flex justify-between text-xs">
          {stockPrices.map((stock) => (
            <div key={stock.symbol} className="text-center">
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-gray-600">{stock.price}</div>
              <div className={stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                {stock.change}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 italic">Click to manage tasks</p>
    </div>
  );

  const backContent = (
    <div className="space-y-6">
      {/* Priority Tasks */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">High Priority Tasks</h4>
        <div className="space-y-3">
          {mockTasks.filter(task => task.priority === "high").map((task) => (
            <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckSquare className="h-4 w-4 text-red-600 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{task.dueDate}</span>
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  </div>
                  <Button size="sm" className="mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule Time Block
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other Tasks */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
        <div className="space-y-2">
          {mockTasks.filter(task => task.priority !== "high").map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <CheckSquare className="h-4 w-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{task.dueDate}</span>
                  <Badge variant="secondary" className="text-xs">{task.priority}</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Stock Information */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Market Overview</h4>
        <div className="grid grid-cols-1 gap-2">
          {stockPrices.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">{stock.symbol}</div>
                <div className="text-xs text-gray-600">Current Price</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{stock.price}</div>
                <div className={`text-xs ${stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" className="justify-start">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button size="sm" variant="outline" className="justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Plan Day
          </Button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Task Summary</h5>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{mockTasks.length}</div>
            <div className="text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">{mockTasks.filter(t => t.priority === "high").length}</div>
            <div className="text-gray-600">Priority</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">5</div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={<CheckSquare className="h-4 w-4" />}
      title="Tasks"
      count={mockTasks.length}
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}
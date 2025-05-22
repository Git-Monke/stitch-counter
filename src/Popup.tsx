import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

import useSound from "use-sound";
import turnOffNotif from "../public/turn-off-notif.mp3";
import turnOnNotif from "../public/turn-on-reminder.mp3";

import { Minus, Pause, Play, Plus, RefreshCw } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface Project {
  name: string;
  id: number;
  stitches: number;
  rows: number;
  repeats: number;
  time: number;
}

type Property = "stitches" | "rows" | "repeats" | "time";

const formatTime = (timeInMs: number): string => {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((timeInMs % 1000) / 10);

  const padZero = (num: number): string =>
    num < 10 ? `0${num}` : num.toString();
  return `${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds)}`;
};

const Timer = ({
  elapsedTime,
  onValueChange,
  isOn,
  onToggle,
  onReset,
}: {
  elapsedTime: number;
  onValueChange: (newTime: number) => void;
  isOn: boolean;
  onToggle: (newState: boolean) => void;
  onReset: () => void;
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOn) {
      intervalRef.current = setInterval(() => {
        onValueChange((elapsedTime += 10));
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOn]);

  return (
    <Card className="bg-gradient-to-r from-stone-400 to-gray-50 h-full p-0 flex justify-center">
      <CardContent className="flex justify-between items-center w-full px-4">
        <span className="text-2xl font-mono tracking-wider">
          {formatTime(elapsedTime)}
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onToggle(!isOn);
            }}
          >
            {isOn ? <Pause /> : <Play />}
          </Button>
          <Button variant="destructive" onClick={onReset}>
            <RefreshCw />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface CounterProps {
  propertyName: Property;
  updateProperty: (property: Property, amount: number) => void;
  initialValue: number;
  updateLastInteract: () => void; // New prop for interaction tracking
}

const Counter = ({
  propertyName,
  updateProperty,
  initialValue,
  updateLastInteract,
}: CounterProps) => {
  const [prop, setProp] = useState(initialValue);

  const handleUpdate = (amount: number) => {
    updateLastInteract(); // Update interaction timestamp
    setProp(prop + amount);
    updateProperty(propertyName, prop + amount);
  };

  return (
    <Card className="flex flex-row h-full items-center p-4 justify-between">
      <span className="font-mono">
        {propertyName}: {prop}
      </span>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            handleUpdate(1);
          }}
        >
          <Plus />
        </Button>

        <Button
          onClick={() => {
            handleUpdate(-1);
          }}
        >
          <Minus />
        </Button>

        <Button
          onClick={() => {
            handleUpdate(-prop);
          }}
          variant="destructive"
        >
          <RefreshCw />
        </Button>
      </div>
    </Card>
  );
};

const Popup = () => {
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [selectedProjectName, setSelectedProjectName] = useState("");

  const [showStitch, setShowStitch] = useState(false);
  const [showRow, setShowRow] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const [timerReminderOff, setTimerReminderOff] = useState(false);
  const [timerReminderOn, setTimerReminderOn] = useState(false);

  const [lastInteractElapsedTime, setLastElapsedInteractTime] = useState(0);
  const [timerIsOn, setTimeIsOn] = useState(false);

  const [playRemindTimerOn] = useSound(turnOnNotif);
  const [playNotifyTimerOff] = useSound(turnOffNotif, {
    volume: 2,
    interrupt: true,
  });

  // Configuration for auto-pause (you can adjust this value or make it configurable in settings)
  const INACTIVITY_THRESHOLD = 1000; // 30 seconds of inactivity before auto-pause

  // Load saved projects and preferences
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("projects");
      const savedSelectedProjectName = localStorage.getItem("selectedProject");

      console.log(savedProjects, savedSelectedProjectName);

      if (savedProjects) {
        const data = JSON.parse(savedProjects);
        setProjects(data);

        if (savedProjects && savedSelectedProjectName) {
          setLastElapsedInteractTime(data[savedSelectedProjectName].time);
        }
      }

      if (savedSelectedProjectName) {
        setSelectedProjectName(savedSelectedProjectName);
      }

      setShowStitch(localStorage.getItem("showStitch") === "true");
      setShowRow(localStorage.getItem("showRow") === "true");
      setShowRepeat(localStorage.getItem("showRepeat") === "true");
      setShowTimer(localStorage.getItem("showTimer") === "true");

      setTimerReminderOff(localStorage.getItem("timerRemindOff") === "true");
      setTimerReminderOn(localStorage.getItem("timerRemindOn") === "true");

      // Initialize interaction time
    } catch (e) {
      console.log(e);
    }
  }, []);

  const selectedProject = useMemo(() => {
    return projects[selectedProjectName];
  }, [projects, selectedProjectName]);

  // Function to update the last interaction timestamp
  const updateLastInteract = useCallback(() => {
    setLastElapsedInteractTime(selectedProject.time);
  }, [selectedProject]);

  // Project update handler
  const handleUpdateProject = useCallback(
    (property: Property, amount: number) => {
      const newProject = {
        ...projects,
        [selectedProjectName]: {
          ...projects[selectedProjectName],
          [property]: amount,
        },
      };

      setProjects(newProject);
      localStorage.setItem("projects", JSON.stringify(newProject));
    },
    [projects, selectedProjectName]
  );

  // Timer disabler
  useEffect(() => {
    if (selectedProject == null) return;
    if (selectedProject.time - lastInteractElapsedTime > INACTIVITY_THRESHOLD) {
      setTimeIsOn(false);
      playNotifyTimerOff();
      toast("Timer disabled due to inactivity");
    }
  }, [selectedProject, lastInteractElapsedTime]);

  if (selectedProjectName == "") {
    return <div className="p-4">No project selected</div>;
  }

  return (
    <div className="flex flex-col h-screen p-1 gap-2">
      {showTimer && (
        // <Timer
        //   startingTime={projects[selectedProject].time}
        //   handleUpdateTime={(updatedTime) => {
        //     handleUpdateProject("time", updatedTime);
        //   }}
        //   updateLastInteract={updateLastInteract}
        //   timeSinceLastInteract={lastInteractTime}
        //   inactivityThreshold={INACTIVITY_THRESHOLD}
        // />
        <Timer
          elapsedTime={selectedProject.time}
          onValueChange={(newTime) => handleUpdateProject("time", newTime)}
          isOn={timerIsOn}
          onToggle={(newState) => {
            updateLastInteract();
            setTimeIsOn(newState);
          }}
          onReset={() => {
            handleUpdateProject("time", 0);
          }}
        />
      )}

      {showStitch && (
        <Counter
          propertyName="stitches"
          updateProperty={handleUpdateProject}
          initialValue={selectedProject.stitches}
          updateLastInteract={updateLastInteract}
        />
      )}

      {showRow && (
        <Counter
          propertyName="rows"
          updateProperty={handleUpdateProject}
          initialValue={selectedProject.rows}
          updateLastInteract={updateLastInteract}
        />
      )}

      {showRepeat && (
        <Counter
          propertyName="repeats"
          updateProperty={handleUpdateProject}
          initialValue={selectedProject.repeats}
          updateLastInteract={updateLastInteract}
        />
      )}

      <Toaster />
    </div>
  );
};

export default Popup;

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

import {
  Check,
  Edit,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Input } from "./components/ui/input";

interface ProjectData {
  stitches: number;
  rows: number;
  repeats: number;
  time: number;
}

interface Project {
  name: string;
  id: string;
  selectedSection: string;
  sections: Record<string, ProjectData>;
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
    <Card className="h-full p-4 flex justify-center flex-1">
      <CardContent className="flex p-0 justify-between items-center w-full">
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
    <Card className="flex flex-row h-full items-center p-4 justify-between flex-1">
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

  const [selectedSection, setSelectedSection] = useState("Unnamed");

  const [isRenamingSection, setRenamingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [showStitch, setShowStitch] = useState(false);
  const [showRow, setShowRow] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const [timerReminderOff, setTimerReminderOff] = useState(false);
  const [timerReminderOn, setTimerReminderOn] = useState(false);

  const [timerReminderOffTime, setTimerReminderOffTime] = useState(10000);
  const [timerReminderOnTime, setTimerReminderOnTime] = useState(10000);

  const [lastInteractElapsedTime, setLastElapsedInteractTime] = useState(0);
  const [timerIsOn, setTimeIsOn] = useState(false);

  const [playRemindTimerOn] = useSound(turnOnNotif, {
    interrupt: true,
  });
  const [playNotifyTimerOff] = useSound(turnOffNotif, {
    volume: 2,
    interrupt: true,
  });

  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_THRESHOLD = timerReminderOffTime * 60 * 1000;
  const REMINDER_INTERVAL = timerReminderOnTime * 60 * 1000;

  function setProjectData(newProjects: Record<string, Project>) {
    setProjects(newProjects);
    localStorage.setItem("projects", JSON.stringify(newProjects));
  }

  // Load saved projects and preferences
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("projects");
      const savedSelectedProjectName: string | null =
        localStorage.getItem("selectedProject");

      if (savedProjects) {
        let data: Record<string, Project> = JSON.parse(savedProjects);
        console.log(data);

        if (savedProjects && savedSelectedProjectName) {
          const selectedProject = data[savedSelectedProjectName];

          let selectedSection = selectedProject.selectedSection;
          let sectionData = selectedProject.sections;

          setLastElapsedInteractTime(sectionData[selectedSection].time);
          setSelectedSection(selectedSection);
        }

        setProjects(data);
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

      const timerReminderOffTime = localStorage.getItem("timerReminderOffTime");
      const timerReminderOnTime = localStorage.getItem("timerReminderOnTime");

      if (timerReminderOffTime) {
        setTimerReminderOffTime(parseInt(timerReminderOffTime));
      }

      if (timerReminderOnTime) {
        setTimerReminderOnTime(parseInt(timerReminderOnTime));
      }
      // Initialize interaction time
    } catch (e) {
      console.log(e);
    }
  }, []);

  const selectedProject = useMemo(() => {
    if (selectedProjectName == "") {
      return null;
    }
    console.log(selectedSection);
    return projects[selectedProjectName].sections[selectedSection];
  }, [projects, selectedProjectName]);

  // Function to update the last interaction timestamp
  const updateLastInteract = useCallback(() => {
    setLastElapsedInteractTime(selectedProject ? selectedProject.time : 0);
  }, [selectedProject]);

  // Project update handler
  const handleUpdateProject = useCallback(
    (property: Property, amount: number) => {
      const newProject = {
        ...projects,
        [selectedProjectName]: {
          ...projects[selectedProjectName],
          sections: {
            ...projects[selectedProjectName].sections,
            [selectedSection]: {
              ...projects[selectedProjectName].sections[selectedSection],
              [property]: amount,
            },
          },
        },
      };

      setProjectData(newProject);
    },
    [projects, selectedProjectName]
  );

  // Timer disabler
  useEffect(() => {
    if (!timerReminderOff) return;
    if (selectedProject == null) return;
    if (selectedProject.time - lastInteractElapsedTime > INACTIVITY_THRESHOLD) {
      setTimeIsOn(false);
      playNotifyTimerOff();
      toast("Timer disabled due to inactivity");
    }
  }, [selectedProject, lastInteractElapsedTime]);

  useEffect(() => {
    if (!timerReminderOn) return;

    if (!timerIsOn) {
      reminderIntervalRef.current = setInterval(() => {
        toast("Don't forget to turn the timer back on!");
        playRemindTimerOn();
      }, REMINDER_INTERVAL);
    } else {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    }

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [timerIsOn]);

  function handleEnableEditingName() {
    setRenamingSection(true);
    setNewSectionName(selectedSection);
  }

  function handleCreateNewSection() {}

  function handleRenameSelectedSection() {
    let newProject = {
      ...projects,
      [selectedProjectName]: {
        ...projects[selectedProjectName],
        sections: {
          ...projects[selectedProjectName].sections,
          [newSectionName]: {
            ...projects[selectedProjectName].sections[selectedSection],
          },
        },
      },
    };

    delete newProject[selectedProjectName].sections[selectedSection];
    newProject[selectedProjectName].selectedSection = newSectionName;

    setProjectData(newProject);
    setSelectedSection(newSectionName);
    setRenamingSection(false);
  }

  function handleSelectSection() {}

  if (selectedProjectName == "") {
    return <div className="p-4">No project selected</div>;
  }

  return (
    <>
      {selectedProject != null ? (
        <SidebarProvider>
          <Sidebar></Sidebar>
          <div className="flex flex-col w-full h-full p-1 gap-2">
            <div className="flex gap-2 items-center h-full">
              <SidebarTrigger className="flex-none"></SidebarTrigger>
              <div className="w-px h-4 bg-gray-800 block"></div>

              {!isRenamingSection ? (
                <>
                  <span className="pl-1">{selectedSection}</span>
                  <Button
                    variant="ghost"
                    onClick={handleEnableEditingName}
                    className="!px-0 m-0 cursor-pointer"
                  >
                    <Edit></Edit>
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      e.key === "Enter" && handleRenameSelectedSection();
                    }}
                    autoFocus={isRenamingSection}
                  ></Input>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleRenameSelectedSection();
                    }}
                    className={`m-0 cursor-pointer ${
                      newSectionName in
                        projects[selectedProjectName].sections &&
                      "disabled opacity-50"
                    }`}
                    disabled={
                      newSectionName in projects[selectedProjectName].sections
                    }
                  >
                    <Check></Check>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRenamingSection(false);
                    }}
                    className={`m-0 cursor-pointer`}
                  >
                    <X></X>
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              {showTimer && (
                <Timer
                  elapsedTime={selectedProject.time}
                  onValueChange={(newTime) =>
                    handleUpdateProject("time", newTime)
                  }
                  isOn={timerIsOn}
                  onToggle={(newState) => {
                    updateLastInteract();
                    setTimeIsOn(newState);
                  }}
                  onReset={() => {
                    setTimeIsOn(false);
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
            </div>
            <Toaster />
          </div>
        </SidebarProvider>
      ) : (
        "Loading data..."
      )}
    </>
  );
};

export default Popup;

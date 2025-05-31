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
  Circle,
  Edit,
  Minus,
  Pause,
  Play,
  Plus,
  PlusCircle,
  RefreshCw,
  Trash,
  X,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
  useSidebar,
} from "./components/ui/sidebar";
import { Input } from "./components/ui/input";
import { Separator } from "@radix-ui/react-separator";

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

const getSums = (project: Project): ProjectData => {
  let result: ProjectData = {
    stitches: 0,
    rows: 0,
    repeats: 0,
    time: 0,
  };

  for (const name in project.sections) {
    for (let keyString in project.sections[name]) {
      const key = keyString as keyof ProjectData;
      result[key] += project.sections[name][key];
    }
  }

  return result;
};

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
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isOn) {
      lastUpdateRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        onValueChange(elapsedTime + Date.now() - lastUpdateRef.current);
        lastUpdateRef.current = Date.now();
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOn, elapsedTime]);

  return (
    <div className="flex items-center justify-between w-full p-2 shadow-md rounded-md bg-gradient-to-br from-white to-slate-50">
      <div className="flex flex-col w-full">
        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
          Time
        </span>
        <div className="flex justify-between">
          <span className="text-2xl  font-bold tracking-wider">
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
        </div>
      </div>
    </div>
  );
};

interface CounterProps {
  propertyName: Property;
  updateProperty: (property: Property, amount: number) => void;
  value: number;
  updateLastInteract: () => void; // New prop for interaction tracking
}

const Counter = ({
  propertyName,
  updateProperty,
  value,
  updateLastInteract,
}: CounterProps) => {
  const handleUpdate = (amount: number) => {
    updateLastInteract(); // Update interaction timestamp
    updateProperty(propertyName, value + amount);
  };

  return (
    <div className="flex items-center justify-between w-full py-2 px-4 shadow-md rounded-md bg-gradient-to-br from-white to-slate-50">
      <div className="flex flex-col w-full">
        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
          {propertyName}
        </span>
        <div className="flex flex-row justify-between w-full">
          <span className="text-2xl font-bold text-slate-900 mt-1">
            {value}
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
                handleUpdate(-value);
              }}
              variant="destructive"
            >
              <RefreshCw />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarButton = ({
  name,
  onClick,
  onDelete,
  canDelete = true,
  selected = false,
}: {
  name: string;
  onClick: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  selected?: boolean;
}) => {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={() => {
        onClick();
        toggleSidebar();
      }}
      className={`flex justify-between w-full ${
        selected && "bg-stone-100 shadow-sm"
      }`}
    >
      <p>{name}</p>
      {canDelete && (
        <div
          className="p-1 hover:bg-red-100 rounded cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash className="text-red-400 w-4 h-4" />
        </div>
      )}
    </SidebarMenuButton>
  );
};

const ShowTotals = ({ onClick }: { onClick: () => void }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      onClick={() => {
        onClick();
        toggleSidebar();
      }}
    >
      <p>Show Totals</p>
    </Button>
  );
};

const SumDisplay = ({ value, name }: { value: any; name: string }) => (
  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col items-center w-full">
        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
          {name}
        </span>
        <span className="text-2xl font-bold text-slate-900 mt-1">{value}</span>
      </div>
    </div>
  </div>
);

const CreateNewSection = ({ onClick }: { onClick: () => void }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={() => {
        onClick();
        toggleSidebar();
      }}
    >
      <Plus className="text-gray-700 fill-current"></Plus>
      <span className="text-gray-700">New Section</span>
    </SidebarMenuButton>
  );
};

const Popup = () => {
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [selectedProjectName, setSelectedProjectName] = useState("");

  const [selectedSection, setSelectedSection] = useState("Unnamed");

  const [isRenamingSection, setRenamingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [isShowingTotals, setIsShowingTotals] = useState(false);

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

  useEffect(() => {
    if (Object.keys(projects).length == 0) return;
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  function handleSetSelectedSection(newSection: string) {
    const newProject: Record<string, Project> = {
      ...projects,
      [selectedProjectName]: {
        ...projects[selectedProjectName],
        selectedSection: newSection,
      },
    };

    setSelectedSection(newSection);
    localStorage.setItem("projects", JSON.stringify(newProject));
  }

  // Load saved projects and preferences
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("projects");
      const savedSelectedProjectName: string | null =
        localStorage.getItem("selectedProject");

      if (savedProjects) {
        let data: Record<string, Project> = JSON.parse(savedProjects);

        if (savedProjects && savedSelectedProjectName) {
          const selectedProject = data[savedSelectedProjectName];

          let selectedSection = selectedProject.selectedSection;
          let sectionData = selectedProject.sections;
          console.log(selectedProject, selectedSection, sectionData);

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
    return projects[selectedProjectName].sections[selectedSection];
  }, [projects, selectedProjectName, selectedSection]);

  // Function to update the last interaction timestamp
  const updateLastInteract = useCallback(() => {
    setLastElapsedInteractTime(selectedProject ? selectedProject.time : 0);
  }, [selectedProject, selectedSection]);

  const handleUpdateProject = useCallback(
    (property: Property, amount: number) => {
      setProjects((oldProjects) => {
        return {
          ...oldProjects,
          [selectedProjectName]: {
            ...oldProjects[selectedProjectName],
            sections: {
              ...oldProjects[selectedProjectName].sections,
              [selectedSection]: {
                ...oldProjects[selectedProjectName].sections[selectedSection],
                [property]: amount,
              },
            },
          },
        };
      });
    },
    [selectedProjectName, selectedSection] // Removed 'projects' since we use oldProjects
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
  }, [
    selectedProject,
    selectedSection,
    lastInteractElapsedTime,
    INACTIVITY_THRESHOLD,
  ]);

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
  }, [timerIsOn, timerReminderOn, REMINDER_INTERVAL]);

  function handleEnableEditingName() {
    setRenamingSection(true);
    setNewSectionName("");
  }

  function handleCreateNewSection() {
    let new_title = "Unnamed";
    let unnamed_index = 1;
    const sections = projects[selectedProjectName].sections;

    if (new_title in sections) {
      while (new_title in sections) {
        new_title = `Unnamed-${unnamed_index}`;
        unnamed_index += 1;
      }
    }

    setProjects((projects) => {
      return {
        ...projects,
        [selectedProjectName]: {
          ...projects[selectedProjectName],
          sections: {
            ...projects[selectedProjectName].sections,
            [new_title]: {
              stitches: 0,
              rows: 0,
              repeats: 0,
              time: 0,
            },
          },
        },
      };
    });

    handleSetSelectedSection(new_title);
    setIsShowingTotals(false);
    setTimeIsOn(false);
  }

  function handleDeleteSection(name: string) {
    let newProject = {
      ...projects,
    };

    delete newProject[selectedProjectName].sections[name];

    setProjects(newProject);
  }

  function handleRenameSelectedSection() {
    if (newSectionName == selectedSection) {
      setRenamingSection(false);
      return;
    }

    if (
      newSectionName in projects[selectedProjectName].sections &&
      newSectionName != selectedSection
    ) {
      return;
    }

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

    setProjects(newProject);
    handleSetSelectedSection(newSectionName);
    setRenamingSection(false);
  }

  if (selectedProjectName == "") {
    return <div className="p-4">No project selected</div>;
  }

  if (selectedProject == null) {
    return "Loading data...";
  }

  const sums = getSums(projects[selectedProjectName]);

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Your Sections</SidebarGroupLabel>
              {Object.entries(projects[selectedProjectName].sections).map(
                ([name, data]) => {
                  return (
                    <SidebarButton
                      name={name}
                      key={name}
                      onClick={() => {
                        handleSetSelectedSection(name);
                        setTimeIsOn(false);
                        setIsShowingTotals(false);
                      }}
                      onDelete={() => {
                        handleDeleteSection(name);
                      }}
                      canDelete={name != selectedSection}
                      selected={name == selectedSection}
                    />
                  );
                }
              )}
              <CreateNewSection
                onClick={handleCreateNewSection}
              ></CreateNewSection>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <ShowTotals
              onClick={() => {
                setIsShowingTotals(true);
              }}
            />
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col w-full h-full p-1 gap-2">
          <div className="flex gap-2 items-center h-full">
            <SidebarTrigger
              className={`flex-none ${
                isRenamingSection && "opacity-30"
              } transition-all duration-250 ease-in-out`}
              disabled={isRenamingSection}
            ></SidebarTrigger>

            {!isShowingTotals &&
              (!isRenamingSection ? (
                <>
                  <div className="w-px h-4 bg-gray-800 block"></div>
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
                    onClick={() => {
                      handleRenameSelectedSection();
                    }}
                    className={`m-0 cursor-pointer `}
                    disabled={
                      newSectionName in
                        projects[selectedProjectName].sections &&
                      newSectionName != selectedSection
                    }
                  >
                    <Check></Check>
                  </Button>
                </>
              ))}
          </div>
          {!isShowingTotals ? (
            <div className="flex flex-col flex-1 min-h-0 p-2 pt-0 gap-2">
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
                  value={selectedProject.stitches}
                  updateLastInteract={updateLastInteract}
                />
              )}
              {showRow && (
                <Counter
                  propertyName="rows"
                  updateProperty={handleUpdateProject}
                  value={selectedProject.rows}
                  updateLastInteract={updateLastInteract}
                />
              )}
              {showRepeat && (
                <Counter
                  propertyName="repeats"
                  updateProperty={handleUpdateProject}
                  value={selectedProject.repeats}
                  updateLastInteract={updateLastInteract}
                />
              )}
            </div>
          ) : (
            <div className="p-8 pt-4 w-full min-h-[400px] bg-gradient-to-br from-white to-slate-50">
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
                  <h2 className="font-bold text-3xl text-slate-800 tracking-tight">
                    Grand Totals
                  </h2>
                  <div className="w-8 h-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"></div>
                </div>
                <p className="text-slate-600 text-sm">Project Summary</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {showTimer && (
                  <SumDisplay
                    value={formatTime(sums.time)}
                    name="Time Invested"
                  />
                )}
                {showStitch && (
                  <SumDisplay
                    value={sums.stitches.toLocaleString()}
                    name="Total Stitches"
                  />
                )}
                {showRow && (
                  <SumDisplay
                    value={sums.rows.toLocaleString()}
                    name="Rows Completed"
                  />
                )}
                {showRepeat && (
                  <SumDisplay
                    value={sums.repeats.toLocaleString()}
                    name="Pattern Repeats"
                  />
                )}
              </div>

              {/* Bottom Accent */}
              <div className="mt-8 flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full"></div>
              </div>
            </div>
          )}
          <Toaster />
        </div>
      </SidebarProvider>
    </>
  );
};

export default Popup;

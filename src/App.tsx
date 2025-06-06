import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import { Button } from "@/components/ui/button";
import { Switch } from "./components/ui/switch";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Popup from "./Popup";
import { Input } from "./components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { PlusCircle, FolderPlus, Scissors, Trash } from "lucide-react";

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

const randomId = function (length = 12) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
};

function App() {
  const [showStitch, setShowStitch] = useState(false);
  const [showRow, setShowRow] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const [selectedProject, setSelectedProject] = useState("");

  const [projects, setProjects] = useState<{ [key: string]: Project }>({});

  // Strangely worded. timerReminderOff = remind user to turn timer off.
  // timerReminderOn = reminder user to turn timer back on
  const [timerReminderOff, setTimerReminderOff] = useState(false);
  const [timerReminderOn, setTimerReminderOn] = useState(false);

  const [timerReminderOffTime, setTimerReminderOffTime] = useState(5);
  const [timerReminderOnTime, setTimerReminderOnTime] = useState(5);

  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load in projects
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("projects");
      const selectedProject = localStorage.getItem("selectedProject");

      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }

      if (selectedProject) {
        setSelectedProject(selectedProject);
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  // Load in Options
  useEffect(() => {
    setShowStitch(localStorage.getItem("showStitch") == "true");
    setShowRow(localStorage.getItem("showRow") == "true");
    setShowRepeat(localStorage.getItem("showRepeat") == "true");
    setShowTimer(localStorage.getItem("showTimer") == "true");

    setTimerReminderOff(localStorage.getItem("timerRemindOff") == "true");
    setTimerReminderOn(localStorage.getItem("timerRemindOn") == "true");

    setTimerReminderOffTime(
      parseInt(localStorage.getItem("timerReminderOffTime") || "5")
    );

    setTimerReminderOnTime(
      parseInt(localStorage.getItem("timerReminderOnTime") || "5")
    );
  }, []);

  // Save projects
  useEffect(() => {
    if (!didMount.current) {
      return;
    }

    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // Save selected project
  useEffect(() => {
    try {
      if (selectedProject != "" && selectedProject != undefined) {
        localStorage.setItem("selectedProject", selectedProject.toString());
        document.title = projects[selectedProject].name;
      }
    } catch {}
  }, [selectedProject]);

  // Save options
  useEffect(() => {
    if (!didMount.current) {
      return;
    }

    localStorage.setItem("showStitch", "" + showStitch);
    localStorage.setItem("showRow", "" + showRow);
    localStorage.setItem("showRepeat", "" + showRepeat);
    localStorage.setItem("showTimer", "" + showTimer);

    localStorage.setItem("timerRemindOff", "" + timerReminderOff);
    localStorage.setItem("timerRemindOn", "" + timerReminderOn);
    localStorage.setItem("timerReminderOffTime", "" + timerReminderOffTime);
    localStorage.setItem("timerReminderOnTime", "" + timerReminderOnTime);
  }, [
    showStitch,
    showRow,
    showRepeat,
    showTimer,
    timerReminderOff,
    timerReminderOn,
    timerReminderOffTime,
    timerReminderOnTime,
  ]);

  const didMount = useRef(false);

  useEffect(() => {
    didMount.current = true;
    return () => {
      didMount.current = false;
    };
  }, []);

  const openPopup = () => {
    const currentOrigin = window.location.href;

    window.open(
      `${currentOrigin}`,
      "Loop Log :D",
      "width=280,height=220,resizable=no,toolbar=no,menubar=no,alwaysRaised=yes"
    );
  };

  const handleAddProject = () => {
    const new_id = randomId();

    const newProject: Project = {
      name: newProjectName,
      id: new_id,
      selectedSection: "Unnamed",
      sections: {
        Unnamed: {
          stitches: 0,
          rows: 0,
          repeats: 0,
          time: 0,
        },
      },
    };

    setProjects((prev) => ({ ...prev, [new_id]: newProject }));
    setSelectedProject(new_id);
    setNewProjectName("");
    setIsDialogOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const newProjects = { ...projects };
    delete newProjects[id];
    setProjects(newProjects);
    setSelectedProject("");
  };

  const isPopup = window.opener !== null;

  if (isPopup) {
    return <Popup />;
  }

  return (
    <div>
      <header className="w-full border-b bg-white mb-2">
        <div className="container mx-4 px-2 h-16 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <Scissors className="h-8 w-8" />
            <span className="font-bold text-xl tracking-light">Loop Log!</span>
          </div>
        </div>
      </header>

      <div className="p-4 w-full flex flex-col items-center gap-8">
        {" "}
        {/* Choose project */}
        <Card className="max-w-sm min-w-sm">
          <CardHeader>
            <CardTitle>1. Create or Choose Project</CardTitle>
            <CardDescription>So your progress saves</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="overflow-hidden p-0">
              <CardContent className="p-0">
                {Object.values(projects).map((project, index) => {
                  return (
                    <div key={project.id}>
                      {index > 0 && <Separator />}
                      <div
                        className={`
                      p-4 cursor-pointer transition-all
                      ${
                        selectedProject == project.id
                          ? "bg-blue-50 text-black"
                          : "text-gray-500 hover:bg-gray-50"
                      }
                      `}
                        onClick={() => {
                          setSelectedProject(project.id);
                        }}
                      >
                        <div
                          key={project.id}
                          className="flex justify-between items-center"
                        >
                          <p>{project.name}</p>
                          <Button
                            variant="ghost"
                            className="!py-0 cursor-pointer"
                            onClick={() => {
                              handleDeleteProject(project.id);
                            }}
                          >
                            <Trash className="text-red-500 fill-current"></Trash>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Separator />

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="p-4 cursor-pointer transition-all hover:bg-gray-50 text-gray-500">
                      <div className="flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        <span>Add New Project</span>
                      </div>
                    </div>
                  </DialogTrigger>

                  <DialogContent className="w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="flex flex-col gap-4">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          placeholder="Enter project name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <DialogFooter className="w-full flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddProject}
                        disabled={!newProjectName.trim()}
                      >
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        {/* Tracker Options */}
        <Card
          className={`max-w-sm ${
            selectedProject != "" ? "" : "opacity-40 pointer-events-none"
          }
                transition-opacity duration-300 ease-in-out min-w-sm`}
        >
          <CardHeader>
            <CardTitle>2. Choose Tracker Options</CardTitle>
            <CardDescription>
              Choose which trackers you would like to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 grid-rows-2 gap-y-4 gap-x-16">
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center">Stitch</p>
                <Switch checked={showStitch} onCheckedChange={setShowStitch} />
              </div>
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center w-full">Row / Round</p>
                <Switch checked={showRow} onCheckedChange={setShowRow} />
              </div>
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center">Repeat</p>
                <Switch checked={showRepeat} onCheckedChange={setShowRepeat} />
              </div>
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center">Timer</p>
                <Switch checked={showTimer} onCheckedChange={setShowTimer} />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Timer Reminders */}
        {showTimer ? (
          <Card
            className={`
          max-w-sm ${showTimer ? "" : "opacity-40 pointer-events-none"}
          transition-opacity duration-300 ease-in-out min-w-sm
          `}
          >
            <CardHeader>
              <CardTitle>3. Set Timer Reminders (optional)</CardTitle>
              <CardDescription>
                So you don't forget to turn it on and off
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 grid-rows-2 gap-x-16 gap-y-4">
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center">Turn Off</p>
                <Switch
                  checked={timerReminderOff}
                  onCheckedChange={setTimerReminderOff}
                />
              </div>
              <div className="flex items-center justify-between gap-4 space-between">
                <p className="flex items-center w-full">Turn On</p>
                <Switch
                  checked={timerReminderOn}
                  onCheckedChange={setTimerReminderOn}
                />
              </div>
              <div className="flex justify-between items-center">
                <Input
                  value={timerReminderOffTime}
                  type="number"
                  onChange={(e) => {
                    setTimerReminderOffTime(parseInt(e.target.value));
                  }}
                  className="max-w-[60px]"
                ></Input>
                <p> Minutes</p>
              </div>
              <div className="flex justify-between items-center">
                <Input
                  value={timerReminderOnTime}
                  type="number"
                  onChange={(e) => {
                    setTimerReminderOnTime(parseInt(e.target.value));
                  }}
                  className="max-w-[60px]"
                ></Input>
                <p> Minutes</p>
              </div>
            </CardContent>
            <CardFooter className="w-full">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-normal text-gray-500">
                    What does this stuff mean?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      <strong>Turn-Off:</strong> When enabled, if you don't use
                      the counter for the specified minutes, the counter will
                      ask if you're still there. No response = auto-pause.
                    </p>
                    <br></br>
                    <p>
                      <strong>Turn-On:</strong> When enabled, if the timer
                      remains off for the specified minutes, it will remind you
                      to restart it and continue sending reminders periodically
                      in case you miss the first one.
                    </p>
                    <br></br>
                    <p>
                      <strong>Minutes Settings:</strong> Control how long each
                      function waits before activating.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardFooter>
          </Card>
        ) : null}
        <Button
          variant="default"
          className="min-w-sm h-16 text-xl"
          onClick={openPopup}
        >
          Create Window!
        </Button>
      </div>
    </div>
  );
}

export default App;

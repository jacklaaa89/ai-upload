"use client";

import React, { useState } from "react";
import {
  FaEdit,
  FaFile,
  FaFileUpload,
  FaFolder,
  FaFolderOpen,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { FaEllipsisVertical } from "react-icons/fa6";
import { GenericContext, Project, ProjectFile } from "../types";
import ContextEditor from "./ContextEditor";

interface ProjectManagerProps {
  projects: Project[];
  onCreateProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManager({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  isOpen,
  onClose,
}: ProjectManagerProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
  const [contextMenuProject, setContextMenuProject] = useState<string | null>(
    null
  );
  const [uploadingFiles, setUploadingFiles] = useState(false);

  if (!isOpen) return null;

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: { enabled: false, items: [] },
      files: [],
    };

    onCreateProject(newProject);
    setNewProjectName("");
    setNewProjectDescription("");
    setIsCreatingProject(false);
    setActiveProject(newProject);
  };

  const handleDeleteProject = (projectId: string) => {
    onDeleteProject(projectId);
    if (activeProject && activeProject.id === projectId) {
      setActiveProject(null);
    }
    setContextMenuProject(null);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return;

    const projectToUpdate = projects.find((p) => p.id === projectId);
    if (!projectToUpdate) return;

    const updatedProject = {
      ...projectToUpdate,
      name: newName,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);

    if (activeProject && activeProject.id === projectId) {
      setActiveProject(updatedProject);
    }

    setIsEditingProject(false);
    setContextMenuProject(null);
  };

  const handleContextChange = (newContext: GenericContext) => {
    if (!activeProject) return;

    const updatedProject = {
      ...activeProject,
      context: newContext,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setActiveProject(updatedProject);
    setIsContextEditorOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !activeProject ||
      !event.target.files ||
      event.target.files.length === 0
    )
      return;

    setUploadingFiles(true);

    const filePromises = Array.from(event.target.files).map((file) => {
      return new Promise<ProjectFile>((resolve) => {
        // Create a URL for the file preview if it's an image
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

        // In a real app, you'd upload the file to a server here
        // For this demo, we'll just create a local file object
        const projectFile: ProjectFile = {
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          type: file.type,
          url: previewUrl || "#", // In a real app, this would be the server URL
          previewUrl,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        // For text files, store the content
        if (
          file.type.includes("text") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".json")
        ) {
          const reader = new FileReader();
          reader.onload = (e) => {
            projectFile.content = e.target?.result as string;
            resolve(projectFile);
          };
          reader.readAsText(file);
        } else {
          resolve(projectFile);
        }
      });
    });

    Promise.all(filePromises).then((newFiles) => {
      const updatedProject = {
        ...activeProject,
        files: [...activeProject.files, ...newFiles],
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
      setActiveProject(updatedProject);
      setUploadingFiles(false);
    });

    // Reset the file input
    event.target.value = "";
  };

  const handleDeleteFile = (fileId: string) => {
    if (!activeProject) return;

    const updatedProject = {
      ...activeProject,
      files: activeProject.files.filter((file) => file.id !== fileId),
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedProject);
    setActiveProject(updatedProject);
  };

  const renderProjectList = () => (
    <div className="border-b pb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">Your Projects</h3>
        <button
          onClick={() => setIsCreatingProject(true)}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          <FaPlus className="mr-1" size={12} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No projects yet. Create your first project to get started.
        </div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex justify-between items-center p-2 rounded-md cursor-pointer group ${
                activeProject?.id === project.id
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveProject(project)}
            >
              <div className="flex items-center">
                {activeProject?.id === project.id ? (
                  <FaFolderOpen className="mr-2 text-blue-600" />
                ) : (
                  <FaFolder className="mr-2 text-gray-500" />
                )}
                <div className="truncate max-w-[180px]">{project.name}</div>
              </div>
              <div className="relative">
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuProject(
                      contextMenuProject === project.id ? null : project.id
                    );
                  }}
                >
                  <FaEllipsisVertical size={14} />
                </button>

                {contextMenuProject === project.id && (
                  <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200 py-1 w-36">
                    <button
                      className="flex items-center w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProject(project);
                        onSelectProject(project.id);
                        onClose();
                      }}
                    >
                      <FaPlus className="mr-2 text-green-600" size={12} />
                      New Chat
                    </button>
                    <button
                      className="flex items-center w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProject(project);
                        setIsEditingProject(true);
                        setNewProjectName(project.name);
                        setNewProjectDescription(project.description);
                        setContextMenuProject(null);
                      }}
                    >
                      <FaEdit className="mr-2 text-blue-600" size={12} />
                      Edit
                    </button>
                    <button
                      className="flex items-center w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <FaTrash className="mr-2" size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProjectDetails = () => {
    if (!activeProject) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a project to view details or create a new project
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-800 mb-1">
            {activeProject.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {activeProject.description || "No description provided"}
          </p>
          <div className="text-xs text-gray-500 mt-1">
            Created {new Date(activeProject.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-700">Project Context</h4>
            <button
              onClick={() => setIsContextEditorOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {activeProject.context.items.length > 0
                ? "Edit Context"
                : "Add Context"}
            </button>
          </div>

          {activeProject.context.enabled &&
          activeProject.context.items.length > 0 ? (
            <div className="text-sm">
              <div
                className={`p-2 rounded ${
                  activeProject.context.enabled
                    ? "bg-green-50 text-green-800"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {activeProject.context.enabled ? "Enabled" : "Disabled"} with{" "}
                {
                  activeProject.context.items.filter((item) => item.enabled)
                    .length
                }{" "}
                active item(s)
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No context defined for this project
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-700">Project Files</h4>
            <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
              <FaFileUpload className="inline mr-1" size={14} />
              Upload Files
            </label>
          </div>

          {uploadingFiles ? (
            <div className="text-gray-600 text-sm">Uploading files...</div>
          ) : activeProject.files.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {activeProject.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center max-w-[80%]">
                    <div className="flex-shrink-0 mr-2">
                      <FaFile className="text-gray-500" />
                    </div>
                    <div className="truncate">
                      <div
                        className="font-medium text-sm truncate"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete file"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No files uploaded to this project
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            onClick={() => {
              setActiveProject(null);
              onSelectProject(activeProject.id);
              onClose();
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Use This Project
          </button>
        </div>
      </div>
    );
  };

  const renderCreateProject = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">Create New Project</h3>
      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter project name"
        />
      </div>
      <div>
        <label
          htmlFor="projectDescription"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="projectDescription"
          value={newProjectDescription}
          onChange={(e) => setNewProjectDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter project description"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button
          onClick={() => setIsCreatingProject(false)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateProject}
          disabled={!newProjectName.trim()}
          className={`px-3 py-1.5 text-sm font-medium text-white rounded ${
            newProjectName.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Create Project
        </button>
      </div>
    </div>
  );

  const renderEditProject = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">Edit Project</h3>
      <div>
        <label
          htmlFor="editProjectName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project Name
        </label>
        <input
          id="editProjectName"
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter project name"
        />
      </div>
      <div>
        <label
          htmlFor="editProjectDescription"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="editProjectDescription"
          value={newProjectDescription}
          onChange={(e) => setNewProjectDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter project description"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button
          onClick={() => setIsEditingProject(false)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => handleRenameProject(activeProject!.id, newProjectName)}
          disabled={!newProjectName.trim()}
          className={`px-3 py-1.5 text-sm font-medium text-white rounded ${
            newProjectName.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Project Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left panel: project list */}
          <div className="w-1/3 p-4 border-r overflow-y-auto">
            {renderProjectList()}
          </div>

          {/* Right panel: project details or creation form */}
          <div className="w-2/3 p-4 overflow-y-auto">
            {isCreatingProject
              ? renderCreateProject()
              : isEditingProject && activeProject
              ? renderEditProject()
              : renderProjectDetails()}
          </div>
        </div>
      </div>

      {activeProject && isContextEditorOpen && (
        <ContextEditor
          context={activeProject.context}
          onContextChange={handleContextChange}
          isOpen={isContextEditorOpen}
          onClose={() => setIsContextEditorOpen(false)}
        />
      )}
    </div>
  );
}

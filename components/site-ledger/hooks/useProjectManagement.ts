import { useState } from 'react';
import { GENERAL, type Project } from '../types';

export function useProjectManagement({
	projects,
	selectedProject,
	createProject,
	updateProjectStatus,
	deleteProject,
}: {
	projects: Project[];
	selectedProject: string;
	createProject: (proj: Project) => Promise<void>;
	updateProjectStatus: (id: string, status: Project['status']) => Promise<void>;
	deleteProject: (id: string, fallbackSelected: string) => Promise<void>;
}) {
	const [addProjectOpen, setAddProjectOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');
	const [manageOpen, setManageOpen] = useState(false);
	const [manageConfirmId, setManageConfirmId] = useState<string | null>(null);

	const handleAddProject = async () => {
		const name = newProjectName.trim();
		if (!name) return;
		const proj: Project = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			name,
			status: 'active',
		};
		await createProject(proj);
		setNewProjectName('');
		setAddProjectOpen(false);
	};

	const handleToggleEndProject = async (id: string) => {
		const proj = projects.find((p) => p.id === id);
		if (!proj) return;
		await updateProjectStatus(id, proj.status === 'ended' ? 'active' : 'ended');
	};

	const handleDeleteProject = async (id: string) => {
		const nextSelected = selectedProject === id ? GENERAL : selectedProject;
		await deleteProject(id, nextSelected);
		setManageConfirmId(null);
	};

	return {
		addProjectOpen,
		setAddProjectOpen,
		newProjectName,
		setNewProjectName,
		manageOpen,
		setManageOpen,
		manageConfirmId,
		setManageConfirmId,
		handleAddProject,
		handleToggleEndProject,
		handleDeleteProject,
	};
}

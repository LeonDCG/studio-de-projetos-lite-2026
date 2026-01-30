import { Project, Meeting } from '../types';

const KEYS = {
  PROJECTS: 'studio_lite_projects',
  MEETINGS: 'studio_lite_meetings',
};

// Projects
export const getProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading projects", e);
    return [];
  }
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const updated = [project, ...projects];
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));
};

export const deleteProject = (projectId: string): void => {
  try {
    const projects = getProjects();
    const updated = projects.filter(p => p.id !== projectId);
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));

    // Cleanup associated meetings
    const meetingsData = localStorage.getItem(KEYS.MEETINGS);
    if (meetingsData) {
      const meetings: Meeting[] = JSON.parse(meetingsData);
      const updatedMeetings = meetings.filter(m => m.projectId !== projectId);
      localStorage.setItem(KEYS.MEETINGS, JSON.stringify(updatedMeetings));
    }
  } catch (e) {
    console.error("Error deleting project", e);
  }
};

// Meetings
export const getMeetings = (projectId: string): Meeting[] => {
  try {
    const data = localStorage.getItem(KEYS.MEETINGS);
    const allMeetings: Meeting[] = data ? JSON.parse(data) : [];
    return allMeetings
      .filter(m => m.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error("Error reading meetings", e);
    return [];
  }
};

export const saveMeeting = (meeting: Meeting): void => {
  try {
    const data = localStorage.getItem(KEYS.MEETINGS);
    const allMeetings: Meeting[] = data ? JSON.parse(data) : [];
    const updated = [meeting, ...allMeetings];
    localStorage.setItem(KEYS.MEETINGS, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving meeting", e);
  }
};
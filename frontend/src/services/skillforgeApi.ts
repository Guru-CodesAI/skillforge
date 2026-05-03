import API from "./api";

export const createProfile = (data: {
  name: string;
  email: string;
  github_username: string;
  experience_level: string;
}) => API.post("/users/profile", data);

export const getProfile = () => API.get("/users/profile");

export const analyzeGitHub = () => API.post("/github/analyze");

export const getRecommendations = () => API.get("/matching/recommendations");

export const getAdminUsers = () => API.get("/admin/users");

export const getAdminStats = () => API.get("/admin/stats");

export const removeUser = (userId: string) => API.delete(`/admin/users/${userId}`);

export const flagUser = (userId: string) => API.patch(`/admin/users/${userId}/flag`);

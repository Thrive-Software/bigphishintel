import { axiosInstance } from './axiosInstance';
import { setToken } from '../utils/tokenManager';

export const getMe = async () => {
  const res = await axiosInstance.get('/api/users/me');
  return res.data;
};

export const updateMe = async (payload) => {
  const res = await axiosInstance.put('/api/users/me', payload);
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await axiosInstance.post('/api/users/me/change-password', {
    currentPassword,
    newPassword,
  });
  // Backend rotates the JWT on success (clears the mustChangePassword flag).
  if (res.data?.token) {
    setToken(res.data.token);
  }
  return res.data;
};

// --- Admin user management ---

export const listUsers = async () => {
  const res = await axiosInstance.get('/api/users');
  return res.data;
};

export const createUser = async (payload) => {
  const res = await axiosInstance.post('/api/users', payload);
  return res.data;
};

export const updateUser = async (id, payload) => {
  const res = await axiosInstance.put(`/api/users/${id}`, payload);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axiosInstance.delete(`/api/users/${id}`);
  return res.data;
};

export const adminResetPassword = async (id, newPassword) => {
  const res = await axiosInstance.post(`/api/users/${id}/reset-password`, { newPassword });
  return res.data;
};

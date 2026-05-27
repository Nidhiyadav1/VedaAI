import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

export const createAssignment = async (formData: FormData) => {
  const { data } = await api.post('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const fetchAssignments = async () => {
  const { data } = await api.get('/assignments');
  return data;
};

export const fetchPaper = async (id: string) => {
  const { data } = await api.get(`/assignments/${id}/paper`);
  return data;
};

export const deleteAssignment = async (id: string) => {
  const { data } = await api.delete(`/assignments/${id}`);
  return data;
};
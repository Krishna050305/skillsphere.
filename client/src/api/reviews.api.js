import api from './auth.api.js';

export const createReview = async (reviewData) => {
  const res = await api.post('/reviews', reviewData);
  return res.data;
};

export const getReviewsForUser = async (userId, page = 1, limit = 10) => {
  const res = await api.get(`/reviews/user/${userId}?page=${page}&limit=${limit}`);
  return res.data;
};

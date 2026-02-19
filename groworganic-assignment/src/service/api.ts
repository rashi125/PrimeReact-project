import axios from "axios";

export const fetchArtworks = async (page: number, limit: number = 10) => {
  const response = await axios.get(
    `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${limit}`
  );

  return {
    data: response.data.data,
    total: response.data.pagination.total,
  };
};
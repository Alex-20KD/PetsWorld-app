import axios from 'axios';

const adoptionApi = axios.create({
  baseURL: 'http://192.168.100.186:3000',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default adoptionApi;

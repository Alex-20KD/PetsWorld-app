import axios from 'axios';
import { ADOPTIONS_API_URL } from './serviceConfig';

const adoptionApi = axios.create({
  baseURL: ADOPTIONS_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function normalizePet(pet) {
  return {
    ...pet,
    image_url: pet.image_url ?? pet.imageUrl ?? null,
    status: pet.status ?? ((pet.is_adopted ?? pet.isAdopted) ? 'adopted' : 'available'),
  };
}

export async function fetchAdoptionPets() {
  const response = await adoptionApi.get('/pets');
  const rawPets = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  return rawPets.map(normalizePet);
}

export async function fetchAdoptionPet(id) {
  const response = await adoptionApi.get('/pets/' + encodeURIComponent(id));
  return normalizePet(response.data?.data ?? response.data);
}

export default adoptionApi;

import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const ReportsContext = createContext(null);

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports debe usarse dentro de un ReportsProvider');
  }
  return context;
}

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  async function fetchReports(filters = {}, page = 1) {
    setLoading(true);
    try {
      const params = { ...filters, page };
      const response = await api.get('/reports', { params });

      // response.data = { success: true, data: { current_page, data: [...], last_page, ... } }
      const payload = response.data;

      // Extraer el objeto de paginación de Laravel
      const paginated = payload.data; // { current_page, data: [...], last_page, total, ... }

      if (paginated && Array.isArray(paginated.data)) {
        // paginated.data es el array real de reportes
        const reportsArray = paginated.data;

        if (page === 1) {
          setReports(reportsArray);
        } else {
          setReports((prev) => [...(Array.isArray(prev) ? prev : []), ...reportsArray]);
        }

        setPagination({
          currentPage: paginated.current_page || page,
          lastPage: paginated.last_page || 1,
          total: paginated.total || reportsArray.length,
        });
      } else if (Array.isArray(paginated)) {
        // Respuesta sin paginación: data es directamente un array
        setReports(paginated);
      } else {
        // Fallback: respuesta inesperada
        setReports([]);
      }

      return { success: true, data: payload };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al cargar los reportes.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function createReport(formData) {
    setLoading(true);
    try {
      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newReport = response.data.data || response.data;
      setReports((prev) => [newReport, ...(Array.isArray(prev) ? prev : [])]);

      return { success: true, data: newReport };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al crear el reporte.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function getReport(id) {
    try {
      const response = await api.get(`/reports/${id}`);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al obtener el reporte.';
      return { success: false, error: message };
    }
  }

  async function updateReport(id, data) {
    try {
      const response = await api.put(`/reports/${id}`, data);
      const updatedReport = response.data.data || response.data;

      setReports((prev) =>
        (Array.isArray(prev) ? prev : []).map((r) => (r.id === id ? updatedReport : r))
      );

      return { success: true, data: updatedReport };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al actualizar el reporte.';
      return { success: false, error: message };
    }
  }

  const value = {
    reports,
    loading,
    pagination,
    fetchReports,
    createReport,
    getReport,
    updateReport,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

export default ReportsContext;

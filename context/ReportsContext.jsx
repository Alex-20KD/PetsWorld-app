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

      const data = response.data;

      // Soporte para respuesta paginada de Laravel
      if (data.data) {
        if (page === 1) {
          setReports(data.data);
        } else {
          setReports((prev) => [...prev, ...data.data]);
        }
        setPagination({
          currentPage: data.current_page || page,
          lastPage: data.last_page || 1,
          total: data.total || data.data.length,
        });
      } else {
        setReports(Array.isArray(data) ? data : []);
      }

      return { success: true, data };
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
      setReports((prev) => [newReport, ...prev]);

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
        prev.map((r) => (r.id === id ? updatedReport : r))
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

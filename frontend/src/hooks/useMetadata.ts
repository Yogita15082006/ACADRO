import { useState, useEffect } from 'react';
import api from '../services/api';

export const useMetadata = () => {
  const [classesList, setClassesList] = useState<string[]>([]);
  const [batchesList, setBatchesList] = useState<string[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [academicYearsList, setAcademicYearsList] = useState<string[]>([]);
  const [semestersList, setSemestersList] = useState<string[]>([]);
  const [statusesList, setStatusesList] = useState<string[]>([]);

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/v1/metadata', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = res.data.data || {};
      setClassesList(data.classes || []);
      setBatchesList(data.batches || []);
      setDepartmentsList(data.departments || []);
      setAcademicYearsList(data.academicYears || []);
      setSemestersList(data.semesters || []);
      setStatusesList(data.statuses || []);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  return { classesList, batchesList, departmentsList, academicYearsList, semestersList, statusesList, refetchMetadata: fetchMetadata };
};

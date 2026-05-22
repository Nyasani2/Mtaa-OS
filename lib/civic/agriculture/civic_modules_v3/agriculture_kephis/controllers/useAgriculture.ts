"use client";

import { useCallback } from "react";
import { useAgricultureStore } from "../state/store";
import { KEPHISService } from "../services/kephisService";
import {
  CropCertificate,
  SeedLicense,
  FarmInspection,
  PestDiseaseReport,
  AgriApplication,
  MarketPrice,
} from "../types";

export function useAgriculture() {
  const store = useAgricultureStore();

  const loadCertificates = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const certs = await KEPHISService.getCertificates(userId);
      store.setCertificates(certs);
    } catch (err: any) {
      store.setError(err.message || "Failed to load certificates");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadSeedLicenses = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const licenses = await KEPHISService.getSeedLicenses(userId);
      store.setSeedLicenses(licenses);
    } catch (err: any) {
      store.setError(err.message || "Failed to load seed licenses");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadInspections = useCallback(async (farmId?: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const inspections = await KEPHISService.getInspections(farmId);
      store.setInspections(inspections);
    } catch (err: any) {
      store.setError(err.message || "Failed to load inspections");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadPestReports = useCallback(async (county?: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const reports = await KEPHISService.getPestReports(county);
      store.setPestReports(reports);
    } catch (err: any) {
      store.setError(err.message || "Failed to load pest reports");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const apps = await KEPHISService.getApplications(userId);
      store.setApplications(apps);
    } catch (err: any) {
      store.setError(err.message || "Failed to load applications");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadMarketPrices = useCallback(async (commodity?: string, county?: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const prices = await KEPHISService.getMarketPrices(commodity, county);
      store.setMarketPrices(prices);
    } catch (err: any) {
      store.setError(err.message || "Failed to load market prices");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const createCertificate = useCallback(async (cert: Omit<CropCertificate, "id" | "created_at" | "updated_at">) => {
    store.setLoading(true);
    store.clearError();
    try {
      const newCert = await KEPHISService.createCertificate(cert);
      store.setCertificates([newCert, ...store.certificates]);
      return newCert;
    } catch (err: any) {
      store.setError(err.message || "Failed to create certificate");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const reportPestDisease = useCallback(async (report: Omit<PestDiseaseReport, "id" | "created_at" | "updated_at">) => {
    store.setLoading(true);
    store.clearError();
    try {
      const newReport = await KEPHISService.reportPestDisease(report);
      store.setPestReports([newReport, ...store.pestReports]);
      return newReport;
    } catch (err: any) {
      store.setError(err.message || "Failed to report pest/disease");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const searchCertificate = useCallback(async (certNumber: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const cert = await KEPHISService.searchCertificate(certNumber);
      store.setSelectedItem(cert);
      return cert;
    } catch (err: any) {
      store.setError(err.message || "Search failed");
      return null;
    } finally {
      store.setLoading(false);
    }
  }, []);

  return {
    ...store,
    loadCertificates,
    loadSeedLicenses,
    loadInspections,
    loadPestReports,
    loadApplications,
    loadMarketPrices,
    createCertificate,
    reportPestDisease,
    searchCertificate,
  };
}

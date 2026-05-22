"use client";

import { useCallback } from "react";
import { useTransportStore } from "../state/store";
import { NTSAService } from "../services/ntsaService";
import {
  DrivingLicense,
  VehicleRegistration,
  InspectionRecord,
  TrafficOffence,
  NTSAApplication,
  RoadIncident,
} from "../types";

export function useTransport() {
  const store = useTransportStore();

  const loadLicenses = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const licenses = await NTSAService.getLicenses(userId);
      store.setLicenses(licenses);
    } catch (err: any) {
      store.setError(err.message || "Failed to load licenses");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadVehicles = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const vehicles = await NTSAService.getVehicles(userId);
      store.setVehicles(vehicles);
    } catch (err: any) {
      store.setError(err.message || "Failed to load vehicles");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadOffences = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const offences = await NTSAService.getOffences(userId);
      store.setOffences(offences);
    } catch (err: any) {
      store.setError(err.message || "Failed to load offences");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const apps = await NTSAService.getApplications(userId);
      store.setApplications(apps);
    } catch (err: any) {
      store.setError(err.message || "Failed to load applications");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const loadIncidents = useCallback(async (county?: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const incidents = await NTSAService.getIncidents(county);
      store.setIncidents(incidents);
    } catch (err: any) {
      store.setError(err.message || "Failed to load incidents");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const registerVehicle = useCallback(async (vehicle: Omit<VehicleRegistration, "id" | "created_at" | "updated_at">) => {
    store.setLoading(true);
    store.clearError();
    try {
      const newVehicle = await NTSAService.registerVehicle(vehicle);
      store.setVehicles([newVehicle, ...store.vehicles]);
      return newVehicle;
    } catch (err: any) {
      store.setError(err.message || "Failed to register vehicle");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const payFine = useCallback(async (id: string, paymentRef: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      await NTSAService.payFine(id, paymentRef);
      const updated = store.offences.map((o) =>
        o.id === id ? { ...o, status: "paid" as const, payment_reference: paymentRef } : o
      );
      store.setOffences(updated);
    } catch (err: any) {
      store.setError(err.message || "Failed to pay fine");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const reportIncident = useCallback(async (incident: Omit<RoadIncident, "id" | "created_at" | "updated_at">) => {
    store.setLoading(true);
    store.clearError();
    try {
      const newIncident = await NTSAService.reportIncident(incident);
      store.setIncidents([newIncident, ...store.incidents]);
      return newIncident;
    } catch (err: any) {
      store.setError(err.message || "Failed to report incident");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const searchPlate = useCallback(async (plateNumber: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const vehicle = await NTSAService.searchPlate(plateNumber);
      store.setSelectedItem(vehicle);
      return vehicle;
    } catch (err: any) {
      store.setError(err.message || "Search failed");
      return null;
    } finally {
      store.setLoading(false);
    }
  }, []);

  return {
    ...store,
    loadLicenses,
    loadVehicles,
    loadOffences,
    loadApplications,
    loadIncidents,
    registerVehicle,
    payFine,
    reportIncident,
    searchPlate,
  };
}

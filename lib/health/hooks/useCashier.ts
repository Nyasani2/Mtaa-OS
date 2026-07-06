import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInsuranceClaims, approveClaim, rejectClaim,
  getInvoices, createInvoice, getUnpaidInvoices, processPayment, getPayments,
} from "@/lib/health/services/cashier.service";

export function useCashierInsurance(status: string) {
  return usePaginatedQuery(["cashier-insurance", status], (range) => getInsuranceClaims(status, range));
}

export function useCashierInvoices(status: string) {
  return usePaginatedQuery(["cashier-invoices", status], (range) => getInvoices(status, range));
}

export function useCashierPayments(method: string) {
  return usePaginatedQuery(["cashier-payments", method], (range) => getPayments(method, range));
}

export function useApproveClaim() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: approveClaim, onSuccess: () => qc.invalidateQueries({ queryKey: ["cashier-insurance"] }) });
}

export function useRejectClaim() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectClaim(id, reason), onSuccess: () => qc.invalidateQueries({ queryKey: ["cashier-insurance"] }) });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createInvoice, onSuccess: () => qc.invalidateQueries({ queryKey: ["cashier-invoices"] }) });
}

export function useUnpaidInvoices() {
  return usePaginatedQuery(["cashier-unpaid-invoices"], (range) => getUnpaidInvoices(range));
}

export function useProcessPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: processPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashier-payments"] });
      qc.invalidateQueries({ queryKey: ["cashier-invoices"] });
      qc.invalidateQueries({ queryKey: ["cashier-unpaid-invoices"] });
    },
  });
}

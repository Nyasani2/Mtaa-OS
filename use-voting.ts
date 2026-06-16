import { useState, useCallback } from 'react';
import {
  getElections,
  getElection,
  getElectionResults,
  getCandidate,
  registerVoter,
  castVote,
  verifyVote,
  getElectionAuditLog,
  reportIncident,
  getActiveElections,
  getIncidents,
  createElection,
  addCandidate,
  removeCandidate,
  updateCandidateStatus,
  getVoterRoll,
  verifyVoter,
  exportVoterRoll,
} from '../services/voting-service';
import type {
  VotingElection,
  VotingCandidate,
  VotingResult,
  VoteChoice,
  CreateElectionInput,
  AddCandidateInput,
  ReportIncidentInput,
  VoterRegistrationInput,
} from '../types/voting-types';

export function useVoting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e: any) {
      setError(e.message || 'An error occurred');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ── Public / Voter ──
  const elections = useCallback(async () => wrap(() => getElections()), []);
  const getElectionById = useCallback(async (id: string) => wrap(() => getElection(id)), []);
  const getElectionResult = useCallback(async (id: string) => wrap(() => getElectionResults(id)), []);
  const getCandidateById = useCallback(async (id: string) => wrap(() => getCandidate(id)), []);
  const registerToVote = useCallback(
    async (electionId: string, data?: VoterRegistrationInput) =>
      wrap(() => registerVoter(electionId, data)),
    []
  );
  const castUserVote = useCallback(
    async (electionId: string, choices: VoteChoice[]) =>
      wrap(() => castVote(electionId, choices)),
    []
  );
  const verifyUserVote = useCallback(async (hash: string) => wrap(() => verifyVote(hash)), []);
  const getAuditLog = useCallback(async (electionId: string) => wrap(() => getElectionAuditLog(electionId)), []);
  const submitIncident = useCallback(async (data: ReportIncidentInput) => wrap(() => reportIncident(data)), []);

  // ── Observer / Admin ──
  const activeElections = useCallback(async () => wrap(() => getActiveElections()), []);
  const allIncidents = useCallback(async () => wrap(() => getIncidents()), []);
  const createNewElection = useCallback(async (data: CreateElectionInput) => wrap(() => createElection(data)), []);
  const addNewCandidate = useCallback(async (data: AddCandidateInput) => wrap(() => addCandidate(data)), []);
  const deleteCandidate = useCallback(async (candidateId: string) => wrap(() => removeCandidate(candidateId)), []);
  const toggleCandidateStatus = useCallback(
    async (candidateId: string, status: string) =>
      wrap(() => updateCandidateStatus(candidateId, status)),
    []
  );
  const voterRoll = useCallback(async (electionId: string) => wrap(() => getVoterRoll(electionId)), []);
  const verifyVoterStatus = useCallback(async (voterId: string) => wrap(() => verifyVoter(voterId)), []);
  const exportRoll = useCallback(async (electionId: string) => wrap(() => exportVoterRoll(electionId)), []);

  return {
    // state
    loading,
    error,

    // public
    elections,
    getElection: getElectionById,
    getElectionResults: getElectionResult,
    getCandidate: getCandidateById,
    registerToVote,
    castVote: castUserVote,
    verifyVote: verifyUserVote,
    getElectionAuditLog: getAuditLog,
    reportIncident: submitIncident,

    // observer / admin
    getActiveElections: activeElections,
    getIncidents: allIncidents,
    createElection: createNewElection,
    addCandidate: addNewCandidate,
    removeCandidate: deleteCandidate,
    updateCandidateStatus: toggleCandidateStatus,
    getVoterRoll: voterRoll,
    verifyVoter: verifyVoterStatus,
    exportVoterRoll: exportRoll,
  };
}

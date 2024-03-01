import assert from "assert";

import type { StableMatcher, StableMatcherWithTrace } from "../include/stableMatching.js";

export function generateInput(n: number): number[][] {
  // TODO
  const data: number[][] = [];
  for (let i = 0; i < n; i++) {
    const temp = [];
    for (let j = 0; j < n; j++) {
      temp.push(j);
    }
    data.push(temp);
  }
  return data.map(arr => performFisherYates(arr));
}

export function performFisherYates(arr: number[]): number[] {
  for (let i = arr.length - 1; i >= 1; i--) {
    const j = randomInt(0, i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const NUM_TESTS = 20; // Change this to some reasonably large value
const N = 6; // Change this to some reasonable size

/**
 * Tests whether or not the supplied function is a solution to the stable matching problem.
 * @param makeStableMatching A possible solution to the stable matching problem
 * @throws An `AssertionError` if `makeStableMatching` in not a solution to the stable matching problem
 */
export function stableMatchingOracle(makeStableMatching: StableMatcher): void {
  for (let i = 0; i < NUM_TESTS; ++i) {
    const companies = generateInput(N);
    const candidates = generateInput(N);
    const hires = makeStableMatching(companies, candidates);

    assert(companies.length === hires.length, "Hires length is correct.");

    // TODO: More assertions go here.
    assert(companies.length === hires.length, "Hires length is correct.");
    assert(companies.length === candidates.length, "We have the same amount of companies and candidates");
    assert(candidates.length === hires.length, "All candidates are being hired");
    hires.forEach(obj => {
      const company = companies[obj.company];
      hires.forEach(loopObj => {
        if (hires.indexOf(obj) !== hires.indexOf(loopObj)) {
          const newCandidate = candidates[loopObj.candidate];
          assert(
            !(
              company.indexOf(loopObj.candidate) < company.indexOf(obj.candidate) &&
              newCandidate.indexOf(obj.company) < newCandidate.indexOf(loopObj.company)
            )
          );
        }
      });
    });
  }
}

// Part B

/**
 * Tests whether or not the supplied function follows the supplied algorithm.
 * @param makeStableMatchingTrace A possible solution to the stable matching problem and its possible steps
 * @throws An `AssertionError` if `makeStableMatchingTrace` does not follow the specified algorithm, or its steps (trace)
 * do not match with the result (out).
 */
export function stableMatchingRunOracle(makeStableMatchingTrace: StableMatcherWithTrace): void {
  for (let i = 0; i < NUM_TESTS; ++i) {
    const companies = generateInput(N);
    const candidates = generateInput(N);
    const { trace, out } = makeStableMatchingTrace(companies, candidates);

    // This statement is here to prevent linter warnings about `trace` and `out` not being used.
    // Remove it as necessary.
    const unmatchedCompanies = new Set<number>(companies.map((_, idx) => idx));
    const unmatchedCandidates = new Set<number>(candidates.map((_, idx) => idx));
    const candidateOffers = new Map<number, number>();

    for (const offer of trace) {
      const { from, to, fromCo } = offer;
      const proposerPreferences = fromCo ? companies[from] : candidates[from];
      const receiverPreferences = fromCo ? candidates[to] : companies[to];

      // Check if the offer is valid
      assert(fromCo ? unmatchedCompanies.has(from) : unmatchedCandidates.has(from), "Party has already been matched");
      assert(proposerPreferences.indexOf(to) !== -1, "Invalid preference for proposer");
      assert(receiverPreferences.indexOf(from) !== -1, "Invalid preference for receiver");

      // Accept or reject the offer
      if (!candidateOffers.has(to)) {
        candidateOffers.set(to, from);
        unmatchedCompanies.delete(from);
        unmatchedCandidates.delete(to);
      } else { 
        const currentPartner = candidateOffers.get(to);
        if (currentPartner === undefined) {
          throw new Error("currentPartner is undefined!");
        }
        const isNewOfferBetter = receiverPreferences.indexOf(from) < receiverPreferences.indexOf(currentPartner);

        if (isNewOfferBetter) {
          candidateOffers.set(to, from);
          unmatchedCompanies.add(currentPartner);
          unmatchedCompanies.delete(from);
        }
      }
    }

    // Validate output
    assert(out.length === companies.length, "Output length should match the number of companies");
    assert(isStableMatching(out, companies, candidates), "The matching is not stable");
  }
}

function isStableMatching(
  out: { company: number; candidate: number }[],
  companies: number[][],
  candidates: number[][]
): boolean {
  const N = companies.length;

  for (const { company, candidate } of out) {
    for (let otherCandidate = 0; otherCandidate < N; ++otherCandidate) {
      if (otherCandidate === candidate) continue;

      const companyPrefersOtherCandidate =
        companies[company].indexOf(otherCandidate) < companies[company].indexOf(candidate);

      if (companyPrefersOtherCandidate) {
        const otherCandidatePartnerIdx = out.findIndex(pair => pair.candidate === otherCandidate);
        const otherCandidatePartner = out[otherCandidatePartnerIdx]?.company ?? -1;

        if (otherCandidatePartner === -1) {
          throw new Error("otherCandidatePartner is undefined!");
        }

        const otherCandidatePrefersCompany =
          candidates[otherCandidate].indexOf(company) < candidates[otherCandidate].indexOf(otherCandidatePartner);

        if (otherCandidatePrefersCompany) {
          return false;
        }
      }
    }

    for (let otherCompany = 0; otherCompany < N; ++otherCompany) {
      if (otherCompany === company) continue;

      const candidatePrefersOtherCompany =
        candidates[candidate].indexOf(otherCompany) < candidates[candidate].indexOf(company);

      if (candidatePrefersOtherCompany) {
        const otherCompanyPartnerIdx = out.findIndex(pair => pair.company === otherCompany);
        const otherCompanyPartner = out[otherCompanyPartnerIdx]?.candidate ?? -1;

        if (otherCompanyPartner === -1) {
          throw new Error("otherCompanyPartner is undefined!");
        }

        const otherCompanyPrefersCandidate =
          companies[otherCompany].indexOf(candidate) < companies[otherCompany].indexOf(otherCompanyPartner);

        if (otherCompanyPrefersCandidate) {
          return false;
        }
      }
    }
  }

  return true;
}
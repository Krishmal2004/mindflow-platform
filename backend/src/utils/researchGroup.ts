export type ResearchGroup = 'ex' | 'cg' | '';

/** Derives the study arm from a profile's research_id suffix (e.g. "MF-2026-001.ex"). */
export function deriveResearchGroup(researchId: string | null | undefined): ResearchGroup {
    if (researchId?.endsWith('.ex')) return 'ex';
    if (researchId?.endsWith('.cg')) return 'cg';
    return '';
}

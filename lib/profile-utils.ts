import { UserProfile, Experience, Education, Project } from "@/types";

export const removeDuplicates = (profile: UserProfile): UserProfile => {
    const cleanProfile = { ...profile };

    const normalize = (str: string | undefined) => {
        return str ? str.toLowerCase().replace(/\s+/g, ' ').trim() : "";
    };

    // Deduplicate Experience
    if (cleanProfile.experience && cleanProfile.experience.length > 0) {
        const seenExp = new Set<string>();
        // Filter out completely empty entries too
        cleanProfile.experience = cleanProfile.experience.filter(exp => {
            if (!exp.role && !exp.company) return false;
            const signature = `${normalize(exp.role)}|${normalize(exp.company)}|${normalize(exp.startDate)}`;
            if (seenExp.has(signature)) return false;
            seenExp.add(signature);
            return true;
        });
    }

    // Deduplicate Education
    if (cleanProfile.education && cleanProfile.education.length > 0) {
        const seenEdu = new Set<string>();
        cleanProfile.education = cleanProfile.education.filter(edu => {
            if (!edu.school && !edu.degree) return false;
            const signature = `${normalize(edu.school)}|${normalize(edu.degree)}`;
            if (seenEdu.has(signature)) return false;
            seenEdu.add(signature);
            return true;
        });
    }

    // Deduplicate Projects
    if (cleanProfile.projects && cleanProfile.projects.length > 0) {
        const seenProj = new Set<string>();
        cleanProfile.projects = cleanProfile.projects.filter(proj => {
            if (!proj.name) return false;
            const signature = `${normalize(proj.name)}`;
            if (seenProj.has(signature)) return false;
            seenProj.add(signature);
            return true;
        });
    }

    // Deduplicate Skills (string list)
    if (cleanProfile.skills) {
        // Split by comma, normalize each skill, then unique
        const skillsArray = cleanProfile.skills.split(',').map(s => normalize(s)).filter(Boolean);
        // Use Set to dedup normalized strings
        const uniqueNormalized = new Set(skillsArray);
        // But we want to keep original casing (first occurrence) ideally?
        // Actually, just returning normalized or title case is better.
        // Let's try to preserve original casing of first occurrence.
        const uniqueSkills: string[] = [];
        const seenSkills = new Set<string>();

        const originalSkills = cleanProfile.skills.split(',').map(s => s.trim()).filter(Boolean);

        for (const skill of originalSkills) {
            const norm = normalize(skill);
            if (!seenSkills.has(norm)) {
                seenSkills.add(norm);
                uniqueSkills.push(skill);
            }
        }

        cleanProfile.skills = uniqueSkills.join(', ');
    }

    return cleanProfile;
};

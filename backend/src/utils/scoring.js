const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const buildDefaultBreakdown = () => ({
  coding_skill_index: {
    problem_solving: 28,
    architecture: 22,
    testing: 20,
  },
  communication_score: {
    clarity: 24,
    articulation: 22,
    collaboration: 18,
  },
  authenticity_score: {
    honesty: 25,
    ownership: 15,
    grit: 20,
  },
  placement_ready: {
    readiness: 30,
    evidence: 20,
  },
});

const deriveBreakdown = (scores) => ({
  coding_skill_index: {
    problem_solving: clamp(Math.round((scores.coding_skill_index / 100) * 50)),
    architecture: clamp(Math.round((scores.coding_skill_index / 100) * 35)),
    testing: clamp(Math.round((scores.coding_skill_index / 100) * 45)),
  },
  communication_score: {
    clarity: clamp(Math.round((scores.communication_score / 100) * 35)),
    articulation: clamp(Math.round((scores.communication_score / 100) * 35)),
    collaboration: clamp(Math.round((scores.communication_score / 100) * 25)),
  },
  authenticity_score: {
    honesty: clamp(Math.round((scores.authenticity_score / 100) * 40)),
    ownership: clamp(Math.round((scores.authenticity_score / 100) * 40)),
    grit: clamp(Math.round((scores.authenticity_score / 100) * 30)),
  },
  placement_ready: {
    readiness: clamp(Math.round((scores.placement_ready / 100) * 55)),
    evidence: clamp(Math.round((scores.placement_ready / 100) * 40)),
  },
});

const deriveGithubInsights = (user) => {
  const stats = user.github_stats || {};
  const languages = Array.isArray(stats.top_languages)
    ? stats.top_languages.map((item) => [item.name ?? item.language ?? 'Unknown', item.value ?? 0])
    : [];

  return {
    top_languages: languages,
    forked: stats.forked ?? 0,
    original: stats.original ?? 0,
    fork_ratio: stats.fork_ratio ?? 0,
  };
};

const deriveScores = (user) => {
  const skillCount = (user.student_skills ?? []).length;
  const linkSignals = [user.github_link, user.leetcode_link, user.linkedin_link].filter(Boolean).length;
  const githubOriginal = Number(user.github_stats?.original) || 0;
  const githubLanguages = Array.isArray(user.github_stats?.top_languages)
    ? user.github_stats.top_languages.length
    : 0;
  const githubSignal = Math.min(14, githubOriginal * 2 + githubLanguages);

  const coding = clamp(55 + skillCount * 4 + linkSignals * 3 + githubSignal, 0, 97);
  const communication = clamp(50 + (user.linkedin_skill_count ?? 0) * 1.5 + linkSignals * 5, 0, 92);
  const authenticity = clamp((user.profile_verified ? 85 : 65) + linkSignals * 2 + Math.min(8, githubOriginal), 50, 100);
  const placement = clamp(
    Math.round((coding * 0.5 + communication * 0.3 + authenticity * 0.2)),
    45,
    98
  );

  return {
    coding_skill_index: coding,
    communication_score: communication,
    authenticity_score: authenticity,
    placement_ready: placement,
  };
};

module.exports = {
  clamp,
  buildDefaultBreakdown,
  deriveBreakdown,
  deriveGithubInsights,
  deriveScores,
};

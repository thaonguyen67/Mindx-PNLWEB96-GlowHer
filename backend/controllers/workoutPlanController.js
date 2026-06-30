import WorkoutPlan from '../models/WorkoutPlan.js';
import Exercise from '../models/Exercise.js';
import geminiModel from '../config/gemini.js';

/* ── exercise library helpers ──────────────────────────────────────── */

const REP_RANGE = {
  strength: [6, 10],
  lose:     [14, 18],
  default:  [10, 14],
};

function repRange(goal) {
  return REP_RANGE[goal] || REP_RANGE.default;
}

/* Build the compact Gemini prompt (mirrors app/plans.jsx makePlanPrompt) */
function makePlanPrompt(goalName, areaNames, weeksCount, daysPerWeek, exerciseNames) {
  return `You are a certified women's strength coach. Design a ${weeksCount}-week plan, ${daysPerWeek} workouts per week.
Goal: ${goalName}. Focus areas: ${areaNames.join(', ')}.
ONLY use exercises from this library, by EXACT name: ${exerciseNames}.
Return STRICT minified JSON only (no markdown, no commentary), using these SHORT keys:
{"intro":"<=22 word encouraging summary","tip":"<=16 word coaching tip","w":[{"f":"2-3 word week focus","d":[{"f":"1-2 word day focus","x":["exact name","exact name","exact name"]}]}]}
Exactly ${weeksCount} items in w, exactly ${daysPerWeek} items in each d, exactly 3 names in each x. Keep it compact.`;
}

/* Parse + validate Gemini response (mirrors normalizeAIPlan) */
function normalizeAIPlan(raw, weeksCount, daysPerWeek, goal, exerciseMap) {
  const weeksSrc = raw && (raw.w || raw.weeks);
  if (!Array.isArray(weeksSrc)) return null;
  const [lo, hi] = repRange(goal);

  const weeks = weeksSrc.slice(0, weeksCount).map((w, wi) => ({
    focus: ((w.f || w.focus || 'Week') + '').replace(/^week\s*\d+\s*[:.\-]?\s*/i, '').slice(0, 24) || 'Focus',
    days: (Array.isArray(w.d || w.days) ? (w.d || w.days) : [])
      .slice(0, daysPerWeek)
      .map(d => {
        const xs = d.x || d.items || [];
        const items = xs.map((it, i) => {
          const nm = (typeof it === 'string' ? it : it?.name || '').toLowerCase().trim();
          const ex = exerciseMap[nm];
          if (!ex) return null;
          return {
            exercise: ex._id,
            exerciseName: ex.name,
            sets: 3 + (wi > 1 ? 1 : 0),
            reps: String(lo + Math.round((hi - lo) * (i % 3) / 2)),
            rest: '60 seconds',
          };
        }).filter(Boolean);
        return { focus: ((d.f || d.focus || 'Workout') + '').slice(0, 24), items };
      })
      .filter(d => d.items.length),
  })).filter(w => w.days.length);

  return weeks.length ? weeks : null;
}

/* Deterministic fallback (mirrors buildLocalPlan) */
function buildLocalPlan(goal, areas, weeksCount, daysPerWeek, allExercises) {
  const [lo, hi] = repRange(goal);
  const focusCycle = areas.length ? areas : ['full'];
  const byArea = {};
  allExercises.forEach(e => {
    if (!byArea[e.bodyPart]) byArea[e.bodyPart] = [];
    byArea[e.bodyPart].push(e);
  });
  const bodyweightPool = allExercises.filter(e => e.equipment === 'bodyweight');
  const weekFocuses = ['Foundations', 'Build', 'Strengthen', 'Peak', 'Push', 'Refine', 'Consolidate', 'Finish'];

  return Array.from({ length: weeksCount }, (_, wi) => ({
    focus: weekFocuses[wi] || `Week ${wi + 1}`,
    days: Array.from({ length: daysPerWeek }, (_, di) => {
      const area = focusCycle[(di + wi) % focusCycle.length];
      let pool = byArea[area] || byArea['full'] || bodyweightPool;
      if (pool.length < 3) pool = pool.concat(bodyweightPool);
      const picks = pool.slice(0, 3);
      return {
        focus: area === 'full' ? 'Full body' : area[0].toUpperCase() + area.slice(1),
        items: picks.map((ex, i) => ({
          exercise: ex._id,
          exerciseName: ex.name,
          sets: 3 + (wi > 1 ? 1 : 0),
          reps: String(lo + Math.round((hi - lo) * (i % 3) / 2)),
          rest: '60 seconds',
        })),
      };
    }),
  }));
}

/* Convert weeks[] → flat days[] with dayNumber + week fields */
function flattenDays(weeks) {
  let dayNum = 1;
  const days = [];
  weeks.forEach((w, wi) => {
    w.days.forEach(d => {
      days.push({
        dayNumber: dayNum++,
        week: wi + 1,
        dayName: `Day ${dayNum - 1} – ${d.focus}`,
        focus: d.focus,
        exercises: d.items,
      });
    });
  });
  return days;
}

/* ── controllers ────────────────────────────────────────────────────── */

export const generatePlan = async (req, res) => {
  try {
    const { goal = 'general', targetBodyParts = [], durationWeeks = 4, daysPerWeek = 3 } = req.body;

    const allExercises = await Exercise.find({});
    const exerciseNames = allExercises.map(e => e.name).join(', ');
    const exerciseMap = {};
    allExercises.forEach(e => { exerciseMap[e.name.toLowerCase().trim()] = e; });

    const goalLabels = { lose: 'Lose weight', tone: 'Tone & sculpt', strength: 'Build strength', glutes: 'Glutes & legs', general: 'General fitness' };
    const goalName = goalLabels[goal] || goal;
    const areaNames = targetBodyParts.length ? targetBodyParts : ['full body'];

    let weeks = null;
    let intro = null;
    let tip = null;
    let aiGenerated = false;

    /* Try Gemini */
    try {
      const prompt = makePlanPrompt(goalName, areaNames, durationWeeks, daysPerWeek, exerciseNames);
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      const raw = JSON.parse(match ? match[0] : text);
      weeks = normalizeAIPlan(raw, durationWeeks, daysPerWeek, goal, exerciseMap);
      if (weeks) {
        intro = raw.intro || null;
        tip = raw.tip || null;
        aiGenerated = true;
      }
    } catch {
      weeks = null;
    }

    /* Fallback */
    if (!weeks) {
      weeks = buildLocalPlan(goal, targetBodyParts, durationWeeks, daysPerWeek, allExercises);
      intro = `A focused ${durationWeeks}-week plan across your target areas, ${daysPerWeek} sessions a week — doable and effective.`;
      tip = 'Consistency beats intensity — just showing up is the win.';
    }

    const days = flattenDays(weeks);
    const title = `${goalName} · ${durationWeeks} weeks`;

    const planPayload = {
      title,
      type: 'ai',
      goal,
      targetBodyParts,
      durationWeeks,
      daysPerWeek,
      intro,
      tip,
      days,
    };

    if (req.user?.id) {
      const plan = await WorkoutPlan.create({ ...planPayload, user: req.user.id });
      return res.status(201).json({
        success: true,
        message: aiGenerated ? 'Plan generated by AI' : 'Plan generated (fallback)',
        data: plan,
      });
    }

    return res.status(201).json({
      success: true,
      message: aiGenerated ? 'Plan generated by AI' : 'Plan generated (fallback)',
      data: planPayload,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getMyPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await WorkoutPlan.countDocuments({ user: req.user.id });
    const plans = await WorkoutPlan.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return res.json({ success: true, message: 'OK', data: { items: plans, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id).populate('days.exercises.exercise');
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found', data: null });
    if (plan.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    return res.json({ success: true, message: 'OK', data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found', data: null });
    if (plan.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    await plan.deleteOne();
    return res.json({ success: true, message: 'Plan deleted', data: null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

import geminiModel from '../config/gemini.js';

function fallbackCalories(weight, day) {
  const exercises = day.exercises || [];
  const sets = exercises.reduce((sum, ex) => sum + (Number(ex.sets) || 3), 0);
  const base = 80 + exercises.length * 35 + sets * 8;
  const bmiFactor = weight / 60;
  return Math.round(Math.min(650, Math.max(120, base * bmiFactor)));
}

export async function estimateCaloriesBurned({ weight, height, day, planTitle }) {
  const exercises = (day.exercises || [])
    .map(ex => `${ex.exerciseName}: ${ex.sets || 3} sets × ${ex.reps || '10'} reps, rest ${ex.rest || '60s'}`)
    .join('\n');

  const prompt = `You are a fitness expert specializing in women's strength training.
Estimate calories burned for a woman completing this workout session.

Profile:
- Weight: ${weight} kg
- Height: ${height} cm
- Sex: female (adult woman)

Plan: ${planTitle}
Day ${day.dayNumber} — ${day.focus || day.dayName || 'Workout'}
Exercises:
${exercises || 'Light full-body session'}

Use MET-based estimates appropriate for women. Respond with ONLY valid JSON:
{"caloriesBurned": <integer from 80 to 700>}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*?\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    const raw = parsed.caloriesBurned ?? parsed.calories ?? parsed.kcal;
    const cal = Math.round(Number(raw));
    if (Number.isFinite(cal) && cal >= 50 && cal <= 900) return cal;
  } catch (err) {
    console.warn('Gemini calorie estimate failed, using fallback:', err.message);
  }

  return fallbackCalories(weight, day);
}

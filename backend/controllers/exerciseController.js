import Exercise from '../models/Exercise.js';

function multiValueFilter(value) {
  if (!value) return undefined;
  const values = (Array.isArray(value) ? value : [value]).filter(Boolean);
  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : { $in: values };
}

export const getAllExercises = async (req, res) => {
  try {
    const { page = 1, limit = 9, bodyPart, difficulty, equipment, search } = req.query;
    const filter = {};
    const bodyPartFilter = multiValueFilter(bodyPart);
    const difficultyFilter = multiValueFilter(difficulty);
    const equipmentFilter = multiValueFilter(equipment);
    if (bodyPartFilter) filter.bodyPart = bodyPartFilter;
    if (difficultyFilter) filter.difficulty = difficultyFilter;
    if (equipmentFilter) filter.equipment = equipmentFilter;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const totalItems = await Exercise.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const items = await Exercise.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({ success: true, message: 'OK', data: { items, totalItems, totalPages, currentPage: Number(page) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found', data: null });
    return res.json({ success: true, message: 'OK', data: exercise });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const createExercise = async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    return res.status(201).json({ success: true, message: 'Exercise created', data: exercise });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const SEED_DATA = [
  { sortOrder: 1, name: 'Bodyweight Squat', nameVi: 'Squat tự trọng lượng', bodyPart: 'legs', equipment: 'bodyweight', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782044115/r7x6dvqubr6bmeleee9u.mp4',
    description: 'A foundational lower-body move. Sit your hips back and down, keep your chest tall, then drive through your heels to stand.',
    descriptionVi: 'Động tác nền tảng cho thân dưới. Đẩy hông ra sau và xuống, giữ ngực thẳng, rồi dồn lực gót chân để đứng lên.',
    benefits: ['Builds leg & glute strength', 'Improves everyday mobility', 'No equipment needed'],
    benefitsVi: ['Tăng sức mạnh chân & mông', 'Cải thiện vận động hằng ngày', 'Không cần dụng cụ'] },
  { sortOrder: 12, name: 'Romanian Deadlift', nameVi: 'Deadlift Romania', bodyPart: 'glutes', equipment: 'barbell', difficulty: 'intermediate',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650938/glowher/romanian-deadlift.mp4',
    description: 'With a slight knee bend, hinge at the hips and lower the bar along your legs, feeling a stretch in your hamstrings.',
    descriptionVi: 'Hơi chùng gối, gập người ở hông và hạ thanh tạ dọc theo chân, cảm nhận sự căng ở cơ đùi sau.',
    benefits: ['Strong hamstrings & glutes', 'Better hip hinge pattern', 'Posture support'],
    benefitsVi: ['Đùi sau & mông khỏe', 'Cải thiện kỹ thuật gập hông', 'Hỗ trợ tư thế'] },
  { sortOrder: 5, name: 'Glute Bridge', nameVi: 'Cây cầu mông', bodyPart: 'glutes', equipment: 'bodyweight', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650931/glowher/glute-bridge.mp4',
    description: 'Lie on your back, knees bent, and lift your hips until your body forms a straight line. Squeeze your glutes at the top.',
    descriptionVi: 'Nằm ngửa, gập gối, nâng hông lên cho tới khi thân tạo thành đường thẳng. Siết cơ mông ở điểm cao nhất.',
    benefits: ['Activates and shapes glutes', 'Gentle on the lower back', 'Great warm-up move'],
    benefitsVi: ['Kích hoạt và tạo dáng cơ mông', 'Nhẹ nhàng với lưng dưới', 'Khởi động tuyệt vời'] },
  { sortOrder: 10, name: 'Barbell Hip Thrust', nameVi: 'Đẩy hông với tạ đòn', bodyPart: 'glutes', equipment: 'barbell', difficulty: 'advanced',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650922/glowher/barbell-hip-thrust.mp4',
    description: 'Upper back on a bench, bar over hips, drive your hips up to full extension and squeeze hard at the top.',
    descriptionVi: 'Tựa lưng trên trên ghế, thanh tạ ngang hông, đẩy hông lên hết tầm và siết chặt ở điểm cao nhất.',
    benefits: ['Top glute-building move', 'Powerful hip drive', 'Supports heavier loads'],
    benefitsVi: ['Động tác phát triển mông số 1', 'Lực đẩy hông mạnh', 'Chịu được tạ nặng'] },
  { sortOrder: 4, name: 'Forearm Plank', nameVi: 'Plank cẳng tay', bodyPart: 'core', equipment: 'bodyweight', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650930/glowher/forearm-plank.mp4',
    description: 'Hold a straight line from head to heels on your forearms, bracing your core and breathing steadily.',
    descriptionVi: 'Giữ đường thẳng từ đầu đến gót trên hai cẳng tay, siết cơ lõi và thở đều.',
    benefits: ['Deep core stability', 'Protects the spine', 'No equipment'],
    benefitsVi: ['Ổn định cơ lõi sâu', 'Bảo vệ cột sống', 'Không cần dụng cụ'] },
  { sortOrder: 11, name: 'Bicycle Crunch', nameVi: 'Gập bụng đạp xe', bodyPart: 'core', equipment: 'bodyweight', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650925/glowher/bicycle-crunches.mp4',
    description: 'On your back, bring opposite elbow to knee in a pedalling motion, keeping the movement slow and controlled.',
    descriptionVi: 'Nằm ngửa, đưa khuỷu tay chạm gối đối diện theo động tác đạp xe, giữ chậm và có kiểm soát.',
    benefits: ['Targets obliques', 'Defines the waist', 'Improves coordination'],
    benefitsVi: ['Tác động cơ liên sườn', 'Tạo eo thon', 'Cải thiện phối hợp'] },
  { sortOrder: 2, name: 'Bent-over Row', nameVi: 'Chèo tạ gập người', bodyPart: 'back', equipment: 'dumbbells', difficulty: 'intermediate',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650923/glowher/bent-over-rows.mp4',
    description: 'Hinge forward with a flat back and pull the dumbbells toward your ribs, squeezing your shoulder blades together.',
    descriptionVi: 'Gập người về trước với lưng phẳng và kéo tạ về phía sườn, siết hai bả vai lại gần nhau.',
    benefits: ['Strong, defined back', 'Better posture', 'Balances pushing work'],
    benefitsVi: ['Lưng khỏe và rõ nét', 'Cải thiện tư thế', 'Cân bằng nhóm cơ đẩy'] },
  { sortOrder: 9, name: 'Push-up', nameVi: 'Hít đất', bodyPart: 'chest', equipment: 'bodyweight', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650935/glowher/push-ups.mp4',
    description: 'Hands under shoulders, body in a straight line, lower your chest to the floor and press back up. Drop to knees to scale.',
    descriptionVi: 'Tay dưới vai, thân thẳng, hạ ngực xuống sàn rồi đẩy lên. Chống gối để giảm độ khó.',
    benefits: ['Upper-body & core strength', 'Scalable for any level', 'Train anywhere'],
    benefitsVi: ['Khỏe thân trên & cơ lõi', 'Điều chỉnh cho mọi trình độ', 'Tập ở bất cứ đâu'] },
  { sortOrder: 3, name: 'Dumbbell Bicep Curl', nameVi: 'Cuốn tạ bắp tay', bodyPart: 'arms', equipment: 'dumbbells', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650926/glowher/dumbbell-bicep-curls.mp4',
    description: 'Keep elbows pinned to your sides and curl the dumbbells up, then lower slowly without swinging.',
    descriptionVi: 'Giữ khuỷu tay sát thân và cuốn tạ lên, rồi hạ chậm mà không đung đưa.',
    benefits: ['Tones the arms', 'Easy to progress', 'Functional grip strength'],
    benefitsVi: ['Săn chắc cánh tay', 'Dễ tăng tiến', 'Tăng lực nắm'] },
  { sortOrder: 7, name: 'Lateral Raise', nameVi: 'Nâng tạ ngang vai', bodyPart: 'shoulders', equipment: 'dumbbells', difficulty: 'beginner',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650928/glowher/dumbbell-lateral-raises.mp4',
    description: 'With a slight bend in the elbows, raise light dumbbells out to the sides up to shoulder height.',
    descriptionVi: 'Hơi gập khuỷu, nâng tạ nhẹ ra hai bên lên tới ngang vai.',
    benefits: ['Shapes shoulder caps', 'Improves shoulder width', 'Great with light weights'],
    benefitsVi: ['Tạo dáng vai tròn', 'Cải thiện độ rộng vai', 'Hợp với tạ nhẹ'] },
  { sortOrder: 6, name: 'Kettlebell Swing', nameVi: 'Vung tạ ấm', bodyPart: 'full', equipment: 'kettlebell', difficulty: 'intermediate',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650932/glowher/kettlebell-swings.mp4',
    description: 'Hinge at the hips and swing the kettlebell to chest height using a powerful glute snap, not your arms.',
    descriptionVi: 'Gập hông và vung tạ ấm lên ngang ngực bằng lực bật mạnh từ mông, không dùng tay.',
    benefits: ['Full-body power & cardio', 'Burns lots of energy', 'Strengthens the hips'],
    benefitsVi: ['Sức mạnh & cardio toàn thân', 'Đốt nhiều năng lượng', 'Tăng sức mạnh hông'] },
  { sortOrder: 8, name: 'Mountain Climber', nameVi: 'Leo núi', bodyPart: 'core', equipment: 'bodyweight', difficulty: 'intermediate',
    video: 'https://res.cloudinary.com/dx4mrkewz/video/upload/v1782650933/glowher/mountain-climber.mp4',
    description: 'In a plank, drive your knees toward your chest one at a time, quickly but with a stable upper body.',
    descriptionVi: 'Ở tư thế plank, lần lượt kéo gối về phía ngực, nhanh nhưng giữ thân trên ổn định.',
    benefits: ['Core + cardio in one', 'Raises heart rate fast', 'Needs no gear'],
    benefitsVi: ['Vừa cơ lõi vừa cardio', 'Tăng nhịp tim nhanh', 'Không cần dụng cụ'] },
];

export const seedExercises = async (req, res) => {
  try {
    await Exercise.deleteMany({});
    const inserted = await Exercise.insertMany(SEED_DATA);
    return res.status(201).json({ success: true, message: `Seeded ${inserted.length} exercises`, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const syncExerciseVideos = async (req, res) => {
  try {
    let updated = 0;
    for (const item of SEED_DATA) {
      if (!item.video) continue;
      const result = await Exercise.updateOne(
        { name: item.name },
        { $set: { video: item.video, sortOrder: item.sortOrder ?? 0, difficulty: item.difficulty } }
      );
      updated += result.modifiedCount;
    }
    const withVideo = await Exercise.countDocuments({ video: { $exists: true, $ne: '' } });
    return res.json({
      success: true,
      message: `Updated ${updated} exercise videos (${withVideo} total with video)`,
      data: { updated, withVideo },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

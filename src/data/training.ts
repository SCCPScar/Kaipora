import type { TrainingDay, Workout, WorkoutExercise } from './types-training';

function ex(exerciseId: string, sets: number, reps: string, restSeconds: number, note?: string): WorkoutExercise {
  return { exerciseId, sets, reps, restSeconds, note };
}

function workout(
  id: string,
  title: string,
  focus: string,
  location: 'academia' | 'casa',
  exercises: WorkoutExercise[],
  tags: string[] = []
): Workout {
  return { id, title, focus, location, tags, exercises };
}

export const TRAINING_WEEK: TrainingDay[] = [
  {
    weekday: 'seg',
    label: 'Segunda-feira',
    academia: workout('seg-academia', 'Push · Peito, Ombros e Tríceps', 'Peito · Ombros · Tríceps', 'academia', [
      ex('crucifixo', 3, '12', 60),
      ex('desenvolvimento', 3, '10', 75),
      ex('elevacao_lateral', 3, '15', 45),
      ex('triceps_polia', 3, '12', 60),
      ex('triceps_extensao', 3, '12', 60)
    ]),
    casa: workout('seg-casa', 'Push em Casa · Peito, Ombros e Tríceps', 'Peito · Ombros · Tríceps', 'casa', [
      ex('flexao', 4, 'até 15', 60),
      ex('pike_push', 3, '10', 60),
      ex('dip_parallel', 3, '12', 45),
      ex('push_up_plank', 3, '10 cada lado', 45),
      ex('plank', 3, '40s', 30)
    ])
  },
  {
    weekday: 'ter',
    label: 'Terça-feira',
    academia: workout('ter-academia', 'Pull · Costas e Bíceps', 'Costas · Bíceps · Core', 'academia', [
      ex('puxador_alto', 4, '10', 75),
      ex('remada_curvada', 3, '12', 60),
      ex('remada_unilateral', 3, '12 cada lado', 60),
      ex('rosca_direta', 3, '12', 45),
      ex('rosca_martelo', 3, '12', 45)
    ]),
    casa: workout('ter-casa', 'Pull em Casa · Costas e Bíceps', 'Costas · Bíceps · Core', 'casa', [
      ex('australian_row', 4, '12', 60, 'Usa uma mesa firme ou barra baixa.'),
      ex('pull_up', 4, 'máx. reps (ou negativas)', 90, 'Sem barra em casa? troca por remada invertida extra.'),
      ex('hanging_knee', 3, '12', 45),
      ex('superman', 3, '15', 45),
      ex('dead_bug', 3, '12 cada lado', 30)
    ])
  },
  {
    weekday: 'qua',
    label: 'Quarta-feira',
    academia: workout(
      'qua-academia',
      'Pernas · Quadríceps e Glúteos',
      'Quadríceps · Glúteos',
      'academia',
      [
        ex('agachamento', 4, '10', 90),
        ex('leg_press', 4, '12', 75),
        ex('extensora', 3, '15', 60),
        ex('afundo', 3, '10 cada perna', 60),
        ex('step_up_banco', 3, '10 cada perna', 60),
        ex('panturrilha', 4, '15', 45)
      ],
      ['gluteos']
    ),
    casa: workout(
      'qua-casa',
      'Pernas em Casa · Quadríceps e Glúteos',
      'Quadríceps · Glúteos',
      'casa',
      [
        ex('squat', 4, '20', 60),
        ex('lunge', 3, '12 cada perna', 60),
        ex('agachamento_salto', 3, '15', 45),
        ex('step_up_casa', 3, '10 cada perna', 60),
        ex('calf_raise', 4, '20', 30)
      ],
      ['gluteos']
    )
  },
  {
    weekday: 'qui',
    label: 'Quinta-feira',
    academia: workout(
      'qui-academia',
      'Programa de Glúteos · Máximo e Médio',
      'Glúteo máximo · Glúteo médio',
      'academia',
      [
        ex('hip_thrust', 4, '12', 75, 'Exercício principal do dia. Aperta bem no topo.'),
        ex('gluteo_cabo', 3, '15 cada perna', 45),
        ex('abducao_quadril', 3, '15', 45),
        ex('stiff_halteres', 3, '12', 75),
        ex('abducao_deitada_cabo', 3, '15 cada lado', 45)
      ],
      ['gluteos']
    ),
    casa: workout(
      'qui-casa',
      'Programa de Glúteos em Casa',
      'Glúteo máximo · Glúteo médio',
      'casa',
      [
        ex('elevacao_quadril_elastico', 4, '15', 60, 'Exercício principal do dia. Aperta bem no topo.'),
        ex('ponte_gluteo_unilateral', 3, '10 cada perna', 45),
        ex('caminhada_lateral_elastico', 3, '15 passos cada lado', 30),
        ex('donkey_kick', 3, '15 cada perna', 30),
        ex('frog_pump', 3, '20', 30)
      ],
      ['gluteos']
    )
  },
  {
    weekday: 'sex',
    label: 'Sexta-feira',
    academia: workout('sex-academia', 'Braços e Ombros', 'Braços · Ombros · Core', 'academia', [
      ex('desenvolvimento', 3, '10', 60),
      ex('elevacao_lateral', 3, '15', 45),
      ex('rosca_direta', 3, '12', 45),
      ex('rosca_martelo', 3, '12', 45),
      ex('triceps_polia', 3, '15', 45),
      ex('prancha', 3, '40s', 30)
    ]),
    casa: workout('sex-casa', 'Braços e Ombros em Casa', 'Braços · Ombros · Core', 'casa', [
      ex('pike_push', 4, '10', 60),
      ex('tricep_dip', 4, '12', 45),
      ex('handstand_pu', 3, 'máx. reps (progressão de parede)', 90),
      ex('push_up_plank', 3, '10 cada lado', 45),
      ex('crunch', 3, '20', 30)
    ])
  },
  {
    weekday: 'sab',
    label: 'Sábado',
    academia: workout(
      'sab-academia',
      'Pernas · Posterior e Glúteos',
      'Posterior de coxa · Glúteos',
      'academia',
      [
        ex('cadeira_flexora', 4, '12', 60),
        ex('stiff_halteres', 3, '12', 75),
        ex('gluteo_maquina', 3, '15', 60),
        ex('elevacao_pelvica_maquina', 3, '15', 60),
        ex('mountain_climber', 3, '30s', 30, 'Finisher cardio.')
      ],
      ['gluteos']
    ),
    casa: workout(
      'sab-casa',
      'Pernas em Casa · Posterior e Glúteos',
      'Posterior de coxa · Glúteos',
      'casa',
      [
        ex('glute_bridge', 4, '15', 45),
        ex('sumo_squat_casa', 4, '15', 60),
        ex('fire_hydrant', 3, '15 cada lado', 30),
        ex('lunge', 3, '12 cada perna', 60, 'Passo mais largo para acentuar o glúteo.'),
        ex('burpee', 3, '10', 60, 'Finisher cardio.')
      ],
      ['gluteos']
    )
  },
  {
    weekday: 'dom',
    label: 'Domingo',
    academia: workout('dom-academia', 'Recuperação Ativa · Core e Mobilidade', 'Core · Mobilidade', 'academia', [
      ex('mountain_climber', 3, '30s', 30),
      ex('prancha', 3, '45s', 30),
      ex('dead_bug', 3, '12 cada lado', 30),
      ex('crunch', 3, '20', 30)
    ]),
    casa: workout('dom-casa', 'Recuperação Ativa em Casa · Core e Mobilidade', 'Core · Mobilidade', 'casa', [
      ex('plank', 3, '45s', 30),
      ex('dead_bug', 3, '12 cada lado', 30),
      ex('superman', 3, '15', 30),
      ex('crunch', 3, '20', 30)
    ])
  }
];

export function getTrainingDay(weekday: TrainingDay['weekday']): TrainingDay {
  const day = TRAINING_WEEK.find((d) => d.weekday === weekday);
  if (!day) throw new Error(`Dia de treino desconhecido: ${weekday}`);
  return day;
}

export function getWorkoutById(workoutId: string): Workout | undefined {
  for (const day of TRAINING_WEEK) {
    if (day.academia.id === workoutId) return day.academia;
    if (day.casa.id === workoutId) return day.casa;
  }
  return undefined;
}

/** All workouts (academia + casa) tagged as part of the dedicated glute program. */
export function getGluteWorkouts(): Workout[] {
  const out: Workout[] = [];
  for (const day of TRAINING_WEEK) {
    if (day.academia.tags?.includes('gluteos')) out.push(day.academia);
    if (day.casa.tags?.includes('gluteos')) out.push(day.casa);
  }
  return out;
}

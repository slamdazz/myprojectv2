import { supabase } from './supabase';

export interface UserStats {
  totalWorkouts: number;
  totalTime: number; // в минутах
  currentStreak: number;
  achievements: number;
  completedCourses: number;
  activeDays: number;
}

export interface ActivityData {
  day: string;
  minutes: number;
  date: string;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('completed, course_id')
      .eq('user_id', userId);

    if (progressError) throw progressError;

    const totalWorkouts = progressData?.filter(p => p.completed).length || 0;

    const courseIds = progressData?.map(p => p.course_id) || [];
    let totalTime = 0;
    
    if (courseIds.length > 0) {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('duration, id')
        .in('id', courseIds);

      if (!coursesError && coursesData) {
     
        progressData?.forEach(progress => {
          if (progress.completed) {
            const course = coursesData.find(c => c.id === progress.course_id);
            if (course) {
              totalTime += course.duration;
            }
          }
        });
      }
    }

    const completedCourses = totalWorkouts;


    const currentStreak = Math.max(1, Math.floor(totalWorkouts / 2)); 

    const { data: achievementsData, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('completed')
      .eq('user_id', userId)
      .eq('completed', true);

    const achievements = achievementsData?.length || 0;

 
    const activeDays = Math.min(totalWorkouts, 30); 

    return {
      totalWorkouts,
      totalTime,
      currentStreak,
      achievements,
      completedCourses,
      activeDays
    };
  } catch (error) {
    console.error('Ошибка при получении статистики пользователя:', error);
    return {
      totalWorkouts: 0,
      totalTime: 0,
      currentStreak: 0,
      achievements: 0,
      completedCourses: 0,
      activeDays: 0
    };
  }
}


export async function getUserActivity(userId: string): Promise<ActivityData[]> {
  try {
   
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const today = new Date();
    const activityData: ActivityData[] = [];

    const { data: progressData, error } = await supabase
      .from('user_progress')
      .select(`
        completed,
        updated_at,
        courses:course_id (
          duration
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; 
      

      let dayMinutes = 0;
      if (progressData && progressData.length > 0) {
 
        const totalCompleted = progressData.filter(p => p.completed).length;
        if (totalCompleted > 0) {
    
          const baseActivity = Math.min(totalCompleted * 10, 60);
          dayMinutes = Math.floor(Math.random() * baseActivity);
          
   
          if (Math.random() < 0.2) dayMinutes = 0;
        }
      }

      activityData.push({
        day: dayName,
        minutes: dayMinutes,
        date: date.toISOString().split('T')[0]
      });
    }

    return activityData;
  } catch (error) {
    console.error('Ошибка при получении активности пользователя:', error);
    

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days.map((day, index) => ({
      day,
      minutes: 0,
      date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
  }
}

export async function getCurrentWorkout(userId: string) {
  try {

    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        completed,
        course_id,
        courses:course_id (
          title,
          duration
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (progressError) throw progressError;

    if (!progressData || progressData.length === 0) {
      return null;
    }

    const userProgress = progressData[0];
    const course = userProgress.courses;
    
    if (!course) {
      return null;
    }


    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('course_id', userProgress.course_id)
      .single();

    if (workoutError || !workoutData) {
      return null;
    }

    const progress = 0;

    return {
      id: workoutData.id,
      title: workoutData.title,
      description: workoutData.description,
      duration: workoutData.duration,
      courseTitle: course.title,
      progress
    };
  } catch (error) {
    console.error('Ошибка при получении текущей тренировки:', error);
    return null;
  }
}
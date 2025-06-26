import React from 'react';
import { Activity, Clock, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';

interface StatsSummaryProps {
  totalWorkouts: number;
  totalTime: number;
  currentStreak: number;
  achievements: number;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  totalWorkouts,
  totalTime,
  currentStreak,
  achievements
}) => {
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;

  const stats = [
    {
      icon: <Activity size={28} strokeWidth={2.2} />,
      label: "Тренировок",
      value: totalWorkouts,
      bgGradient: "from-blue-500 to-blue-700",
      iconBg: "bg-blue-500/20"
    },
    {
      icon: <Clock size={28} strokeWidth={2.2} />,
      label: "Время",
      value: hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`,
      bgGradient: "from-green-500 to-teal-600",
      iconBg: "bg-green-500/20"
    },
    {
      icon: <Calendar size={28} strokeWidth={2.2} />,
      label: "Серия",
      value: `${currentStreak} дн.`,
      bgGradient: "from-orange-500 to-amber-600",
      iconBg: "bg-orange-500/20"
    },
    {
      icon: <Trophy size={28} strokeWidth={2.2} />,
      label: "Награды",
      value: achievements,
      bgGradient: "from-purple-500 to-violet-700",
      iconBg: "bg-purple-500/20"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat, index) => (
        <motion.div key={index} variants={item}>
          <Card className={`rounded-2xl bg-gradient-to-br ${stat.bgGradient} text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}>
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className={`w-14 h-14 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

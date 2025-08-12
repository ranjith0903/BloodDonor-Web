import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, Target, Users, Heart } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const AchievementsPage = () => {
  const { user } = useUserStore();
  const [achievements] = useState([
    {
      id: 1,
      title: "First Blood",
      description: "Complete your first donation",
      icon: "🩸",
      points: 100,
      level: "bronze",
      unlocked: true,
      progress: { current: 1, target: 1 }
    },
    {
      id: 2,
      title: "Regular Donor",
      description: "Complete 5 donations",
      icon: "🏆",
      points: 250,
      level: "silver",
      unlocked: false,
      progress: { current: 2, target: 5 }
    },
    {
      id: 3,
      title: "Lifesaver",
      description: "Complete 10 donations",
      icon: "💎",
      points: 500,
      level: "gold",
      unlocked: false,
      progress: { current: 2, target: 10 }
    },
    {
      id: 4,
      title: "Emergency Hero",
      description: "Respond to 3 emergency requests",
      icon: "🚨",
      points: 300,
      level: "silver",
      unlocked: false,
      progress: { current: 0, target: 3 }
    },
    {
      id: 5,
      title: "Consistent Donor",
      description: "Donate 3 times in 6 months",
      icon: "🔥",
      points: 200,
      level: "bronze",
      unlocked: false,
      progress: { current: 1, target: 3 }
    },
    {
      id: 6,
      title: "Community Champion",
      description: "Participate in 5 campaigns",
      icon: "👥",
      points: 400,
      level: "gold",
      unlocked: false,
      progress: { current: 0, target: 5 }
    }
  ]);

  const totalPoints = achievements.reduce((sum, achievement) => {
    return sum + (achievement.unlocked ? achievement.points : 0);
  }, 0);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const getLevelColor = (level) => {
    switch (level) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-gray-500';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-blue-500';
      case 'diamond': return 'text-purple-500';
      default: return 'text-gray-600';
    }
  };

  const getLevelBg = (level) => {
    switch (level) {
      case 'bronze': return 'bg-amber-100';
      case 'silver': return 'bg-gray-100';
      case 'gold': return 'bg-yellow-100';
      case 'platinum': return 'bg-blue-100';
      case 'diamond': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="h-12 w-12 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Achievements & Gamification</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Track your progress and unlock achievements as you save lives
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{unlockedCount}</h3>
          <p className="text-gray-600">Achievements Unlocked</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-3">
            <Star className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalPoints}</h3>
          <p className="text-gray-600">Total Points</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-3">
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{achievements.length}</h3>
          <p className="text-gray-600">Total Achievements</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-3">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{Math.round((unlockedCount / achievements.length) * 100)}%</h3>
          <p className="text-gray-600">Completion Rate</p>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all duration-300 ${
              achievement.unlocked 
                ? 'border-green-500 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{achievement.icon}</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBg(achievement.level)} ${getLevelColor(achievement.level)}`}>
                {achievement.level.toUpperCase()}
              </div>
            </div>

            <h3 className={`text-xl font-semibold mb-2 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-600'}`}>
              {achievement.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4">
              {achievement.description}
            </p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">
                {achievement.points} points
              </span>
              {achievement.unlocked && (
                <div className="flex items-center text-green-600">
                  <Award className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Unlocked</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%`
                }}
              ></div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              {achievement.progress.current} / {achievement.progress.target}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">How Gamification Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold mb-2">Donate Blood</h3>
            <p className="text-gray-600 text-sm">
              Earn points and unlock achievements for each donation
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Help Emergencies</h3>
            <p className="text-gray-600 text-sm">
              Respond to emergency requests for bonus achievements
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Monitor your achievements and compete with others
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage; 
import { useAchievementStore, ACHIEVEMENTS } from '@/store/achievementStore';
import AchievementBadge from './AchievementBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, CheckCircle2, Zap, Star } from 'lucide-react';
import type { AchievementCategory } from '@/types';

const CATEGORY_INFO: Record<AchievementCategory, { label: string; icon: React.ReactNode }> = {
  streak: { label: 'Streak', icon: <Flame className="w-4 h-4" /> },
  completion: { label: 'Tasks', icon: <CheckCircle2 className="w-4 h-4" /> },
  productivity: { label: 'Daily', icon: <Zap className="w-4 h-4" /> },
  special: { label: 'Special', icon: <Star className="w-4 h-4" /> },
};

export default function AchievementList() {
  const { getUnlockedAchievements } = useAchievementStore();
  const unlockedAchievements = getUnlockedAchievements();

  const categories: AchievementCategory[] = ['streak', 'completion', 'productivity', 'special'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Achievements
          <span className="text-sm font-normal text-muted-foreground">
            ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="gap-1">
                {CATEGORY_INFO[category].icon}
                <span className="hidden sm:inline">{CATEGORY_INFO[category].label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {ACHIEVEMENTS.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  showProgress
                  size="sm"
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {ACHIEVEMENTS.filter((a) => a.category === category).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    showProgress
                    size="sm"
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

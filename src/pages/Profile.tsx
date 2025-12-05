import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useGitHubStore } from '@/store/githubStore';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useStreakStore } from '@/store/streakStore';
import { useNotificationStore } from '@/store/notificationStore';
import { GitHubService, validateGitHubToken } from '@/services/github';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Github,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  Flame,
  Target,
  ExternalLink,
  Moon,
  Sun,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  BarChart3,
  Bell,
  BellOff,
} from 'lucide-react';
import AchievementList from '@/components/achievement/AchievementList';
import StatisticsReport from '@/components/statistics/StatisticsReport';
import {
  exportToJSON,
  exportTodosToCSV,
  exportStatisticsToCSV,
  importFromJSON,
} from '@/lib/export';

export default function Profile() {
  const {
    connection,
    repos,
    isLoading,
    error,
    setAccessToken,
    setUser,
    setRepos,
    setLoading,
    setError,
    disconnect,
    loadConnection,
  } = useGitHubStore();

  const todos = useTodoStore((state) => state.todos);
  const setTodos = useTodoStore((state) => state.setTodos);
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const roadmapItems = useRoadmapStore((state) => state.items);
  const { currentStreak, longestStreak, loadStreak } = useStreakStore();
  const {
    permission,
    settings: notificationSettings,
    checkPermission,
    requestPermission,
    updateSettings: updateNotificationSettings,
    loadSettings: loadNotificationSettings,
  } = useNotificationStore();

  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConnection();
    loadStreak();
    loadNotificationSettings();
    checkPermission();
    // Check dark mode
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [loadConnection, loadStreak, loadNotificationSettings, checkPermission]);

  useEffect(() => {
    if (connection.isConnected && connection.accessToken && repos.length === 0) {
      loadRepos();
    }
  }, [connection.isConnected, connection.accessToken]);

  const loadRepos = async () => {
    if (!connection.accessToken) return;

    try {
      setLoading(true);
      const service = new GitHubService(connection.accessToken);
      const userRepos = await service.getRepos();
      setRepos(userRepos);
    } catch (err) {
      console.error('Failed to load repos:', err);
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await validateGitHubToken(tokenInput);
      setAccessToken(tokenInput);
      setUser(user);

      const service = new GitHubService(tokenInput);
      const userRepos = await service.getRepos();
      setRepos(userRepos);

      setTokenInput('');
      toast.success('GitHub connected', {
        description: `Welcome, ${user.login}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      toast.error('Connection failed', {
        description: err instanceof Error ? err.message : 'Please check your token and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  const handleEnableNotifications = async () => {
    if (notificationSettings.enabled) {
      updateNotificationSettings({ enabled: false });
      toast.info('Notifications disabled');
    } else {
      if (permission === 'granted') {
        updateNotificationSettings({ enabled: true });
        toast.success('Notifications enabled');
      } else {
        const granted = await requestPermission();
        if (granted) {
          toast.success('Notifications enabled');
        } else {
          toast.error('Permission denied', {
            description: 'Please enable notifications in your browser settings.',
          });
        }
      }
    }
  };

  // Export handlers
  const handleExportJSON = () => {
    exportToJSON({
      todos,
      projects,
      roadmapItems,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    });
    toast.success('Backup exported', {
      description: `${todos.length} tasks and ${projects.length} projects saved`,
    });
  };

  const handleExportTodosCSV = () => {
    exportTodosToCSV(todos, projects);
    toast.success('Tasks exported to CSV');
  };

  const handleExportStatsCSV = () => {
    exportStatisticsToCSV(todos, { current: currentStreak, longest: longestStreak });
    toast.success('Statistics exported to CSV');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await importFromJSON(file);
    if (data) {
      setTodos(data.todos);
      setProjects(data.projects);
      setImportStatus('success');
      toast.success('Backup restored', {
        description: `${data.todos.length} tasks and ${data.projects.length} projects imported`,
      });
      setTimeout(() => setImportStatus('idle'), 3000);
    } else {
      setImportStatus('error');
      toast.error('Import failed', {
        description: 'Please check the file format and try again.',
      });
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate stats
  const completedTodos = todos.filter((t) => t.status === 'completed').length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>

      {/* User Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {connection.user?.avatar_url ? (
                <AvatarImage src={connection.user.avatar_url} alt={connection.user.login} />
              ) : null}
              <AvatarFallback className="text-xl">
                {connection.user?.login?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {connection.user?.name || connection.user?.login || 'Guest User'}
              </h2>
              {connection.user?.login && (
                <p className="text-sm text-muted-foreground">@{connection.user.login}</p>
              )}
              {!connection.isConnected && (
                <p className="text-sm text-muted-foreground">Connect GitHub to sync</p>
              )}
            </div>
            {connection.isConnected && (
              <Badge variant="secondary" className="gap-1">
                <Github className="w-3 h-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{completedTodos}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Flame className="w-6 h-6 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistics Report
          </CardTitle>
          <CardDescription>
            Track your productivity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatisticsReport />
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <AchievementList />

      {/* GitHub Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to auto-complete tasks from commits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection.isConnected ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Connected as @{connection.user?.login}</p>
                  {connection.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(connection.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => {
                    disconnect();
                    toast.info('GitHub disconnected');
                  }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {repos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Repositories ({repos.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {repos.slice(0, 5).map((repo) => (
                        <div
                          key={repo.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <span className="text-sm truncate flex-1">{repo.full_name}</span>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                      {repos.length > 5 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{repos.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Create a Personal Access Token with <code className="bg-muted px-1 py-0.5 rounded text-xs">repo</code> scope:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to GitHub Settings → Developer settings → Tokens</li>
                  <li>Generate new token (classic)</li>
                  <li>Select repo scope</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? 'Connecting...' : 'Connect'}
                </Button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? 'Light' : 'Dark'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationSettings.enabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
            Notifications
          </CardTitle>
          <CardDescription>
            Get reminded about upcoming tasks and celebrate your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied'
                  ? 'Blocked in browser settings'
                  : permission === 'granted'
                    ? 'Browser permission granted'
                    : 'Permission not requested'}
              </p>
            </div>
            <Switch
              checked={notificationSettings.enabled}
              onCheckedChange={handleEnableNotifications}
              disabled={permission === 'denied'}
            />
          </div>

          {notificationSettings.enabled && (
            <>
              <Separator />

              {/* Notification Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Due Date Reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified before tasks are due
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.dueDateReminders}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ dueDateReminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Streak Reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Don't let your streak break
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.streakReminder}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ streakReminder: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Completion Celebration</p>
                    <p className="text-xs text-muted-foreground">
                      Celebrate when you complete tasks
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.completionCelebration}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ completionCelebration: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Daily Reminder</p>
                    <p className="text-xs text-muted-foreground">
                      Daily task overview at {notificationSettings.dailyReminderTime}
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReminder}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ dailyReminder: checked })
                    }
                  />
                </div>

                {notificationSettings.dailyReminder && (
                  <div className="flex items-center gap-2 pl-4">
                    <label className="text-sm text-muted-foreground">Time:</label>
                    <Input
                      type="time"
                      value={notificationSettings.dailyReminderTime}
                      onChange={(e) =>
                        updateNotificationSettings({ dailyReminderTime: e.target.value })
                      }
                      className="w-28"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data for backup or import from a previous backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Export</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 mr-2" />
                Full Backup (JSON)
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTodosCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                TODOs (CSV)
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportStatsCSV}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistics (CSV)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Import Option */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Import</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="w-4 h-4 mr-2" />
                Restore from Backup
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              {importStatus === 'success' && (
                <span className="text-sm text-green-600">Imported successfully!</span>
              )}
              {importStatus === 'error' && (
                <span className="text-sm text-destructive">Import failed. Check file format.</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Only JSON backup files created by TaskFlow are supported
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>TaskFlow v1.0.0</p>
        <p>AI-Powered Personal TODO Management</p>
      </div>
    </div>
  );
}
